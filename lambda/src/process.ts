import type { SiteNewsArticle, ParsedFeedItem, ScoredCandidate } from "./types.js"
import { translateToPortuguese } from "./translate.js"
import { saveArticle, articleExistsFull } from "./dynamodb.js"
import {
  stripTags, normalizeEncoding, normalizeText, decodeEntities, slugify,
  looksMostlyEnglish, clipText, sanitizeHtml, extractTag, extractAttribute,
  extractMetaContent, cleanFeedText, paragraphizeText, extractParagraphText,
  textToHtmlParagraphs, fetchSourceArticleText,
} from "./utils.js"

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_NEWS_AGE_DAYS = 10
const MAX_HISTORY_AGE_DAYS = 30
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-4o-mini"

const RSS_FEEDS = [
  { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC Politics", url: "http://feeds.bbci.co.uk/news/politics/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "G1", url: "https://g1.globo.com/rss/g1/" },
  { name: "UOL Notícias", url: "https://rss.uol.com.br/feed/noticias.xml" },
  { name: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss.xml" },
  { name: "World History Encyclopedia", url: "https://www.worldhistory.org/rss/" },
  { name: "Smithsonian History", url: "https://www.smithsonianmag.com/rss/history/" },
  { name: "History Extra", url: "https://www.historyextra.com/feed/" },
]

const HISTORY_SOURCES = new Set(["History Extra", "Smithsonian History", "World History Encyclopedia"])

const CATEGORY_RULES = [
  { categoria: "Exploração Espacial", keywords: ["artemis","nasa","spacex","space mission","space program","space exploration","space flight","space station","orbita","marte","astronaut","rocket launch","moon landing","lunar mission"] },
  { categoria: "Conflitos", keywords: ["guerra","war","conflit","ataque","attack","missil","missile","bomb","troops","ceasefire","militar","navio de guerra"] },
  { categoria: "Política", keywords: ["elei","election","president","premier","prime minister","governo","parliament","congresso","coalition","opposition"] },
  { categoria: "Economia Global", keywords: ["trade","tariff","econom","mercado","inflation","sanction","energy","oil","gas","supply chain"] },
  { categoria: "História", keywords: ["histori","arqueolog","artifact","heritage","museum","ancient","patrimonio","memoria"] },
]

const RELEVANT_KEYWORDS = ["geopolit","diplomac","guerra","war","conflit","election","elei","president","prime minister","sanction","trade","military","militar","border","fronteira","nato","otan","united nations","onu","parliament","territory","territorio","oil","gas","space","lua","artemis","nasa","moon","histori","historic","arqueolog","heritage","museum"]
const NEGATIVE_KEYWORDS = ["futebol","celebrity","celebridade","horoscope","horoscopo","loteria","reality show"]
const GLOBAL_PRIORITY_KEYWORDS = ["eua","estados unidos","china","russia","ucrania","otan","onu","uniao europeia","european union","middle east","oriente medio","israel","iran","gaza","taiwan","coreia","india","pakistan","africa","global","international","diplomac","border","trade","tariff","sanction","war","conflit","space","nasa","artemis"]

const SOURCE_WEIGHTS: Record<string, number> = {
  "BBC World": 50, "BBC Politics": 48, "Al Jazeera": 46, "The Guardian World": 44,
  "World History Encyclopedia": 40, "Smithsonian History": 38, "History Extra": 38,
  "Agência Brasil": 28, G1: 20, "UOL Notícias": 18,
}

const GENERIC_FALLBACK_IMAGES = new Set([
  "/historical-books-and-world-map-study.jpg",
  "/world-map-with-geopolitical-tensions.jpg",
  "/geopolitics-world-map-with-news-overlay.jpg",
])

// ─── image utilities ──────────────────────────────────────────────────────────

function normalizeImageUrl(url?: string): string {
  if (!url) return ""
  const normalized = decodeEntities(url).trim()
  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/")) return ""
  if (/(logo|icon|favicon|avatar|sprite)/i.test(normalized)) return ""
  if (/(flag_of|seal_of|coat_of_arms|locator_map|blank_map|orthographic|relief_location)/i.test(normalized)) return ""
  if (/w16|w24|w32|w48/i.test(normalized)) return ""

  // Some CDNs (e.g. the Guardian's i.guim.co.uk) sign the transform query
  // params — rewriting width/height/quality without recalculating that
  // signature invalidates it (401 "invalid signature"). Leave signed URLs
  // untouched instead of forcing our own dimensions.
  if (/[?&](s|sig|signature|token)=/i.test(normalized)) return normalized

  return normalized
    .replace(/([?&])(width|w)=\d+/gi, "$1$2=1600")
    .replace(/([?&])(height|h)=\d+/gi, "$1$2=900")
    .replace(/([?&])(quality|q)=\d+/gi, "$1$2=90")
}

function extractImage(item: string, html: string): string {
  return [
    extractAttribute(item, "media:content", "url"),
    extractAttribute(item, "media:thumbnail", "url"),
    extractAttribute(item, "enclosure", "url"),
    extractAttribute(html, "img", "src"),
  ].map((c) => normalizeImageUrl(c)).find(Boolean) ?? ""
}

function inferImage(article: { titulo: string; descricao: string; categoria: string }): string {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`)
  if (/(space|lua|artemis|nasa|moon|apollo|marte|astronaut)/.test(text)) return "/historical-books-and-world-map-study.jpg"
  if (/(guerra|war|conflit|attack|bomb|militar|oriente medio|border|troops)/.test(text)) return "/world-map-with-geopolitical-tensions.jpg"
  return "/geopolitics-world-map-with-news-overlay.jpg"
}

async function fetchSourcePageImage(url?: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return ""
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return ""
    const html = await res.text()
    const metaImage =
      extractMetaContent(html, "og:image") ||
      extractMetaContent(html, "twitter:image") ||
      extractMetaContent(html, "og:image:url")
    return normalizeImageUrl(metaImage)
  } catch {
    return ""
  }
}

async function searchWikimediaImages(query: string): Promise<Array<{ imageUrl: string; score: number }>> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php")
    url.searchParams.set("action", "query")
    url.searchParams.set("format", "json")
    url.searchParams.set("generator", "search")
    url.searchParams.set("gsrsearch", query)
    url.searchParams.set("gsrlimit", "5")
    url.searchParams.set("prop", "pageimages|info")
    url.searchParams.set("piprop", "thumbnail")
    url.searchParams.set("pithumbsize", "1600")
    url.searchParams.set("inprop", "url")

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "EventosHistoricosBot/1.0" },
    })
    if (!res.ok) return []

    const data = (await res.json()) as {
      query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> }
    }

    return Object.values(data.query?.pages ?? {})
      .map((page) => {
        const imageUrl = normalizeImageUrl(page.thumbnail?.source)
        const pageTitle = normalizeText(page.title ?? "")
        let score = imageUrl ? 0 : -100
        if (pageTitle.includes(normalizeText(query))) score += 40
        if (/(ship|port|strait|gulf|commission|trump|ukraine|european union|brussels|iran)/.test(pageTitle)) score += 18
        if (/(flag|seal|map|locator|coat of arms)/.test(pageTitle)) score -= 60
        return { imageUrl, score }
      })
      .filter((e) => e.imageUrl)
      .sort((a, b) => b.score - a.score)
  } catch {
    return []
  }
}

async function requestOpenAIImageHints(article: { titulo: string; descricao: string; categoria: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_image_hints",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                searchQueries: { type: "array", items: { type: "string" } },
                theme: { type: "string" },
              },
              required: ["searchQueries", "theme"],
            },
          },
        },
        messages: [
          { role: "system", content: "Voce escolhe pistas de busca para imagens editoriais de noticias. Retorne de 3 a 5 consultas curtas e especificas para buscar imagem no Wikimedia. Priorize entidades reais, lugares, organizacoes e temas centrais da noticia." },
          { role: "user", content: JSON.stringify(article) },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content
    if (!raw) return null
    const parsed = JSON.parse(raw) as { searchQueries?: string[]; theme?: string }
    return {
      searchQueries: [...new Set((parsed.searchQueries ?? []).map((q) => normalizeEncoding(q).trim()).filter((q) => q.length >= 3))].slice(0, 5),
      theme: normalizeEncoding(parsed.theme ?? "").trim(),
    }
  } catch {
    return null
  }
}

async function isImageReachable(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const headRes = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(timeoutMs) })
    if (headRes.ok) return true
    // Some CDNs (e.g. the Guardian's signed image proxy) reject HEAD or need
    // a real GET to evaluate the request signature — retry with a tiny range
    // request before giving up on the URL.
    if ([405, 501].includes(headRes.status)) {
      const getRes = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Range: "bytes=0-0" },
      })
      return getRes.ok
    }
    return false
  } catch {
    return false
  }
}

async function resolveArticleImage(
  article: { titulo: string; descricao: string; categoria: string; link?: string },
  feedImage?: string,
  timeoutMs = 8000,
): Promise<string> {
  const normalized = normalizeImageUrl(feedImage)
  // Feeds sometimes hand out signed CDN URLs (the Guardian's i.guim.co.uk
  // being the reproducible case) that 401 for anyone but the Guardian's own
  // frontend — accepting them unchecked meant the article was saved with an
  // image that 401s for every real visitor. Validate before accepting.
  if (normalized && !GENERIC_FALLBACK_IMAGES.has(normalized) && (await isImageReachable(normalized))) return normalized

  const sourceImage = await Promise.race([
    fetchSourcePageImage(article.link),
    new Promise<string>((resolve) => setTimeout(() => resolve(""), timeoutMs)),
  ])
  // og:image scraped from the source page can be the same kind of signed CDN
  // URL as the feed image (reproduced with the Guardian: og:image is also a
  // i.guim.co.uk URL that 401s) — validate this candidate too instead of
  // trusting it just because it came from the page's own metadata.
  if (sourceImage && (await isImageReachable(sourceImage))) return sourceImage

  const aiHints = await requestOpenAIImageHints(article)
  const queries = [...new Set([
    ...(aiHints?.searchQueries ?? []),
    article.titulo.split(" ").slice(0, 4).join(" "),
    ...(aiHints?.theme ? [`${aiHints.theme} ${article.categoria}`] : []),
  ].map((q) => q.trim()).filter((q) => q.length >= 3))].slice(0, 4)

  const allResults = await Promise.all(queries.map(searchWikimediaImages))
  const best = allResults
    .flatMap((results, i) => results.slice(0, 4).map((r) => ({ ...r, score: r.score + Math.max(0, 40 - i * 10) })))
    .sort((a, b) => b.score - a.score)[0]

  return best?.imageUrl || inferImage(article)
}

// ─── AI expansion ─────────────────────────────────────────────────────────────

async function expandArticleWithAI(article: {
  titulo: string; descricao: string; categoria: string; fonte: string; contexto?: string
}): Promise<string> {
  const fallback = article.contexto?.trim() || article.descricao
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: "Você é editor de um portal brasileiro de geopolítica e história. Com base no título, resumo e contexto adicional de uma notícia internacional, escreva um artigo informativo em português do Brasil com 3 a 4 parágrafos bem desenvolvidos. Mantenha-se fiel aos fatos apresentados. Não invente informações que não estejam no contexto fornecido. Escreva de forma clara, objetiva e jornalística. Separe os parágrafos com duas quebras de linha. Não inclua título nem cabeçalho, apenas os parágrafos." },
          { role: "user", content: `Título: ${article.titulo}\nResumo: ${article.descricao}\nContexto adicional do feed: ${article.contexto || "(nenhum)"}\nCategoria: ${article.categoria}\nFonte: ${article.fonte}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return fallback
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    return content ? normalizeEncoding(content) : fallback
  } catch {
    return fallback
  }
}

// ─── RSS parsing & scoring ────────────────────────────────────────────────────

function hasTruncationMarker(rawHtml: string) {
  const normalized = normalizeText(decodeEntities(rawHtml))
  return (
    /(continue reading|read more|leia mais|saiba mais|veja mais)\s*(\.\.\.)?\s*(<\/a>)?\s*$/.test(normalized.trim()) ||
    /\[\+\d+\s*chars?\]/.test(normalized) ||
    normalized.trim().endsWith("...") ||
    normalized.trim().endsWith("…")
  )
}

function parseRssItems(xml: string, feedName: string): ParsedFeedItem[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
  return items.map((item) => {
    const titulo = stripTags(extractTag(item, "title"))
    const link = stripTags(extractTag(item, "link"))
    const contentEncoded = extractTag(item, "content:encoded")
    const description = extractTag(item, "description")
    const data = stripTags(extractTag(item, "pubDate"))
    const fonte = stripTags(extractTag(item, "source")) || feedName
    const rawSource = contentEncoded || description
    const conteudoHtml = sanitizeHtml(rawSource)
    const descricao = extractParagraphText(description || contentEncoded).split(/\n\s*\n/)[0] || titulo
    const imagem = extractImage(item, contentEncoded || description)
    return {
      titulo: normalizeEncoding(titulo),
      descricao: normalizeEncoding(descricao),
      conteudoHtml,
      data,
      fonte: normalizeEncoding(fonte),
      link,
      imagem,
      truncated: hasTruncationMarker(rawSource),
    }
  }).filter((item) => Boolean(item.titulo && item.link))
}

async function fetchFeed(url: string, name: string): Promise<ParsedFeedItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    if (!res.ok) return []
    return parseRssItems(await res.text(), name)
  } catch {
    return []
  }
}

function isRelevantArticle(article: ParsedFeedItem): boolean {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  return RELEVANT_KEYWORDS.some((k) => text.includes(k)) && !NEGATIVE_KEYWORDS.some((k) => text.includes(k))
}

function inferCategory(article: ParsedFeedItem): string {
  if (HISTORY_SOURCES.has(article.fonte)) return "História"
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  return CATEGORY_RULES.find((r) => r.keywords.some((k) => text.includes(k)))?.categoria ?? "Geopolítica"
}

function scoreArticle(article: ParsedFeedItem, categoria: string): number {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  const sourceScore = SOURCE_WEIGHTS[article.fonte] ?? 24
  const categoryScore = categoria === "Geopolítica" ? 40 : categoria === "Conflitos" ? 38 : categoria === "Política" ? 34 : categoria === "Economia Global" ? 30 : categoria === "Exploração Espacial" ? 28 : 24
  const globalScore = GLOBAL_PRIORITY_KEYWORDS.filter((k) => text.includes(k)).length * 8
  const titleBonus = /(war|guerra|election|elei|crise|summit|coup|sanction|otan|onu|nasa|artemis)/.test(text) ? 12 : 0
  const articleDate = article.data ? new Date(article.data) : new Date()
  const ageHours = Number.isNaN(articleDate.getTime()) ? 9999 : (Date.now() - articleDate.getTime()) / 36e5
  const ageScore = ageHours <= 12 ? 140 : ageHours <= 24 ? 115 : ageHours <= 48 ? 90 : ageHours <= 72 ? 70 : ageHours <= 120 ? 45 : ageHours <= 168 ? 25 : ageHours <= 240 ? 10 : -20
  return sourceScore + categoryScore + globalScore + titleBonus + ageScore
}

function buildRssSlug(item: ParsedFeedItem): string {
  const parsedDate = item.data ? new Date(item.data) : new Date()
  const datePart = Number.isNaN(parsedDate.getTime()) ? "atual" : parsedDate.toISOString().slice(0, 10)
  return slugify(`${item.fonte}-${item.titulo}-${datePart}`)
}

function buildScoredCandidate(item: ParsedFeedItem): ScoredCandidate | null {
  const categoria = inferCategory(item)
  const parsedDate = item.data ? new Date(item.data) : new Date()
  if (Number.isNaN(parsedDate.getTime())) return null
  const ageDays = (Date.now() - parsedDate.getTime()) / 86_400_000
  const maxAge = categoria === "História" ? MAX_HISTORY_AGE_DAYS : MAX_NEWS_AGE_DAYS
  if (ageDays > maxAge) return null
  return { item, categoria, score: scoreArticle(item, categoria), data: parsedDate.toISOString() }
}

async function getAllScoredCandidates(): Promise<ScoredCandidate[]> {
  const results = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.name)))
  const seen = new Set<string>()
  return results.flat()
    .filter(isRelevantArticle)
    .filter((item) => {
      const key = normalizeText(`${item.titulo}-${item.link}`)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(buildScoredCandidate)
    .filter((c): c is ScoredCandidate => c !== null)
}

// ─── hydration & enrichment ───────────────────────────────────────────────────

async function hydrateScoredCandidate(candidate: ScoredCandidate, imageTimeoutMs = 8000): Promise<SiteNewsArticle> {
  const { item, categoria, data } = candidate
  const slug = buildRssSlug(item)
  const resumo = item.truncated || item.descricao.endsWith("...") || item.conteudoHtml.length < 600
  const rawText = extractParagraphText(item.conteudoHtml || item.descricao) || item.descricao || item.titulo

  const imageFallback = inferImage({ titulo: item.titulo, descricao: item.descricao, categoria })

  const [imagem, translatedTitle, translatedDesc, translatedBody] = await Promise.all([
    Promise.race([
      resolveArticleImage({ titulo: item.titulo, descricao: item.descricao, categoria, link: item.link }, item.imagem, imageTimeoutMs),
      new Promise<string>((resolve) => setTimeout(() => resolve(imageFallback), imageTimeoutMs)),
    ]),
    translateToPortuguese(item.titulo),
    translateToPortuguese(item.descricao),
    translateToPortuguese(rawText),
  ])

  const notice = `<p><em>Conteúdo do feed oficial de <strong>${item.fonte}</strong>, curado pelo Eventos Históricos.</em></p>`

  return {
    id: `rss-${slug}`,
    slug,
    titulo: translatedTitle,
    descricao: clipText(translatedDesc || "Resumo selecionado automaticamente a partir de feeds abertos e confiáveis.", 220),
    conteudo: translatedBody,
    conteudoHtml: `${textToHtmlParagraphs(translatedBody)}${notice}`,
    resumo,
    data,
    categoria,
    fonte: item.fonte,
    fonteUrl: item.link,
    linkFonte: item.link,
    imagem,
    tags: [normalizeText(categoria), "rss", normalizeText(item.fonte)],
    href: `/noticias/${slug}`,
    externo: false,
    tipo: "rss",
    idioma: "en",
    noticeHtml: notice,
    tituloOriginal: item.titulo,
    descricaoOriginal: item.descricao,
    conteudoOriginal: rawText,
  }
}

async function enrichArticle(article: SiteNewsArticle): Promise<SiteNewsArticle> {
  const needsImage = !article.imagem || GENERIC_FALLBACK_IMAGES.has(article.imagem)
  const needsText = article.tipo === "rss" && article.resumo

  if (!needsText && !needsImage) return article

  const sourceLink = article.linkFonte || article.fonteUrl

  // Image-only update when text is already enriched
  if (!needsText) {
    const img = await fetchSourcePageImage(sourceLink)
    return img ? { ...article, imagem: img } : article
  }

  // Fetch text and og:image in parallel (separate HTTP requests in Lambda)
  const [scrapedText, img] = await Promise.all([
    fetchSourceArticleText(sourceLink),
    needsImage ? fetchSourcePageImage(sourceLink) : Promise.resolve(""),
  ])

  let body: string
  let bodyOriginal: string | undefined
  let bodySource: "scraped" | "ai" = "ai"

  if (scrapedText && scrapedText.length > article.conteudo.length + 200) {
    const isEn = looksMostlyEnglish(scrapedText)
    body = isEn ? await translateToPortuguese(scrapedText) : scrapedText
    bodyOriginal = isEn ? scrapedText : undefined
    bodySource = "scraped"
  } else {
    const aiText = await expandArticleWithAI({
      titulo: article.titulo,
      descricao: article.descricao,
      categoria: article.categoria,
      fonte: article.fonte,
      contexto: article.conteudo,
    })
    if (aiText.trim() === article.conteudo.trim()) {
      // Text enrichment failed; still save updated image if we got one
      if (img && img !== article.imagem) return { ...article, imagem: img }
      return article
    }
    body = aiText
  }

  const notice =
    bodySource === "scraped"
      ? `<p><em>Conteúdo obtido a partir da reportagem original de <strong>${article.fonte}</strong>, reorganizado pelo Eventos Históricos. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a matéria original</a>.</em></p>`
      : `<p><em>Artigo elaborado pela redação editorial do Eventos Históricos com base na cobertura de <strong>${article.fonte}</strong>. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a reportagem original</a>.</em></p>`

  return {
    ...article,
    imagem: (needsImage && img) ? img : article.imagem,
    conteudo: body,
    conteudoHtml: `${textToHtmlParagraphs(body)}${notice}`,
    idioma: bodyOriginal ? "en" : article.idioma,
    noticeHtml: notice,
    conteudoOriginal: bodyOriginal ?? article.conteudoOriginal,
    resumo: false,
  }
}

// ─── main refresh ─────────────────────────────────────────────────────────────

export async function refreshArticles(): Promise<{ processed: number; skipped: number }> {
  console.log("[refresh] fetching RSS candidates...")
  const candidates = (await getAllScoredCandidates())
    .sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 20)

  console.log(`[refresh] ${candidates.length} candidates found`)

  const checked = await Promise.all(
    candidates.map(async (candidate) => {
      const slug = buildRssSlug(candidate.item)
      const exists = await articleExistsFull(slug)
      return { candidate, slug, exists }
    }),
  )

  const toProcess = checked.filter((c) => !c.exists)
  const skipped = checked.length - toProcess.length

  console.log(`[refresh] ${toProcess.length} to process, ${skipped} already in DB`)

  await Promise.allSettled(
    toProcess.map(async ({ candidate }) => {
      try {
        const hydrated = await hydrateScoredCandidate(candidate, 8000)
        const enriched = await enrichArticle(hydrated)
        await saveArticle(enriched)
        console.log(`[refresh] saved: ${enriched.slug}`)
      } catch (err) {
        console.error(`[refresh] failed: ${candidate.item.titulo}`, err)
      }
    }),
  )

  return { processed: toProcess.length, skipped }
}
