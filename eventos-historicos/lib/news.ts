import noticiasData from "@/data/noticias.json"
import { generatePortalAnalysis } from "@/lib/news-editorial"

export interface SiteNewsArticle {
  id: string
  slug: string
  titulo: string
  descricao: string
  conteudo: string
  conteudoHtml: string
  resumo: boolean
  data: string
  categoria: string
  autor?: string
  fonte: string
  fonteUrl?: string
  linkFonte?: string
  imagem: string
  tags: string[]
  href: string
  externo: boolean
  tipo: "rss" | "local" | "analysis"
}

interface ParsedFeedItem {
  titulo: string
  descricao: string
  conteudoHtml: string
  data: string
  fonte: string
  link: string
  imagem?: string
}

const FEED_REVALIDATE_SECONDS = 300
const WIKIMEDIA_REVALIDATE_SECONDS = 86_400
const MAX_NEWS_AGE_DAYS = 10
const MAX_HISTORY_AGE_DAYS = 30
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_IMAGE_HINT_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-5-mini"
const GENERIC_FALLBACK_IMAGES = new Set([
  "/historical-books-and-world-map-study.jpg",
  "/world-map-with-geopolitical-tensions.jpg",
  "/geopolitics-world-map-with-news-overlay.jpg",
])

type ImageHintArticle = {
  titulo: string
  descricao: string
  categoria: string
}

type OpenAIImageHintResponse = {
  searchQueries: string[]
  theme: string
}

type WikimediaImageCandidate = {
  imageUrl: string
  score: number
}

const imageHintCache = new Map<string, Promise<OpenAIImageHintResponse | null>>()
const sourceImageCache = new Map<string, Promise<string>>()
const localizationCache = new Map<string, Promise<{ titulo: string; descricao: string } | null>>()

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

const CATEGORY_RULES = [
  {
    categoria: "Exploração Espacial",
    keywords: ["lua", "artemis", "nasa", "spacex", "space", "moon", "apollo", "orbita", "marte", "astronaut"],
  },
  {
    categoria: "Conflitos",
    keywords: ["guerra", "war", "conflit", "ataque", "attack", "missil", "missile", "bomb", "troops", "ceasefire", "militar", "navio de guerra"],
  },
  {
    categoria: "Política",
    keywords: ["elei", "election", "president", "premier", "prime minister", "governo", "parliament", "congresso", "coalition", "opposition"],
  },
  {
    categoria: "Economia Global",
    keywords: ["trade", "tariff", "econom", "mercado", "inflation", "sanction", "energy", "oil", "gas", "supply chain"],
  },
  {
    categoria: "História",
    keywords: ["histori", "arqueolog", "artifact", "heritage", "museum", "ancient", "patrimonio", "memoria"],
  },
]

const RELEVANT_KEYWORDS = [
  "geopolit",
  "diplomac",
  "guerra",
  "war",
  "conflit",
  "election",
  "elei",
  "president",
  "prime minister",
  "sanction",
  "trade",
  "military",
  "militar",
  "border",
  "fronteira",
  "nato",
  "otan",
  "united nations",
  "onu",
  "parliament",
  "territory",
  "territorio",
  "oil",
  "gas",
  "space",
  "lua",
  "artemis",
  "nasa",
  "moon",
  "histori",
  "historic",
  "arqueolog",
  "heritage",
  "museum",
]

const NEGATIVE_KEYWORDS = ["futebol", "celebrity", "celebridade", "horoscope", "horoscopo", "loteria", "reality show"]

const GLOBAL_PRIORITY_KEYWORDS = [
  "eua",
  "estados unidos",
  "china",
  "russia",
  "ucrania",
  "otan",
  "onu",
  "uniao europeia",
  "european union",
  "middle east",
  "oriente medio",
  "israel",
  "iran",
  "gaza",
  "taiwan",
  "coreia",
  "india",
  "pakistan",
  "africa",
  "global",
  "international",
  "diplomac",
  "border",
  "trade",
  "tariff",
  "sanction",
  "war",
  "conflit",
  "space",
  "nasa",
  "artemis",
]

const BRAZIL_GENERAL_KEYWORDS = [
  "brasil",
  "brasileira",
  "brasileiro",
  "lula",
  "bolsonaro",
  "stf",
  "camara",
  "senado",
  "brasilia",
  "rio de janeiro",
  "sao paulo",
]

const SOURCE_WEIGHTS: Record<string, number> = {
  "BBC World": 50,
  "BBC Politics": 48,
  "Al Jazeera": 46,
  "The Guardian World": 44,
  "World History Encyclopedia": 40,
  "Smithsonian History": 38,
  "History Extra": 38,
  "Agência Brasil": 28,
  G1: 20,
  "UOL Notícias": 18,
}

interface PortalAnalysisThemeRule {
  id: string
  label: string
  category: string
  tags: string[]
  image: string
  keywords: string[]
}

interface PortalAnalysisGroup {
  theme: PortalAnalysisThemeRule
  articles: SiteNewsArticle[]
  averageScore: number
}

const PORTAL_ANALYSIS_THEMES: PortalAnalysisThemeRule[] = [
  {
    id: "oriente-medio",
    label: "Oriente Medio e rotas estrategicas",
    category: "Geopolitica",
    tags: ["geopolitica", "oriente medio", "seguranca internacional"],
    image: "/world-map-with-geopolitical-tensions.jpg",
    keywords: ["iran", "israel", "lebanon", "gaza", "hormuz", "persian gulf", "tehran", "middle east"],
  },
  {
    id: "ucrania-e-europa",
    label: "Europa, Ucrania e seguranca regional",
    category: "Conflitos",
    tags: ["europa", "ucrania", "seguranca europeia"],
    image: "/geopolitics-world-map-with-news-overlay.jpg",
    keywords: ["ukraine", "russia", "putin", "kyiv", "moscow", "nato", "orban", "hungary"],
  },
  {
    id: "economia-global",
    label: "Pressao economica e mercados globais",
    category: "Economia Global",
    tags: ["economia global", "comercio", "mercados"],
    image: "/historical-books-and-world-map-study.jpg",
    keywords: ["imf", "tariff", "trade", "oil", "energy", "inflation", "sanction", "recession", "steel"],
  },
  {
    id: "tecnologia-e-espaco",
    label: "Tecnologia, espaco e competicao estrategica",
    category: "Exploracao Espacial",
    tags: ["tecnologia", "espaco", "inovacao estrategica"],
    image: "/historical-books-and-world-map-study.jpg",
    keywords: ["space", "nasa", "artemis", "moon", "satellite", "chip", "technology"],
  },
]

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeEncoding(value: string) {
  return value
    .replace(/\uFFFD/g, "")
    .replace(/Ã¡/g, "á")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ãª/g, "ê")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç")
    .replace(/Ã"/g, "Ó")
    .replace(/Ã/g, "à")
}

function decodeEntities(value: string) {
  return normalizeEncoding(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim(),
  )
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

function extractAttribute(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

function extractMetaContent(html: string, propertyName: string) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

function extractImagesByPattern(html: string, pattern: RegExp) {
  return [...html.matchAll(pattern)]
    .map((match) => normalizeImageUrl(match[1]))
    .filter(Boolean)
}

function extractSourceSpecificImage(html: string, url: string) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return ""
    }
  })()

  const patterns: RegExp[] = []

  if (hostname.includes("aljazeera.com")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*responsive-image[^"']*["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']+["'][^>]*>/gi,
    )
  }

  if (hostname.includes("theguardian.com")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+itemprop=["']contentUrl["'][^>]*>/gi,
      /<source[^>]+srcset=["']([^ "'?,]+[^"']*)["']/gi,
    )
  }

  if (hostname.includes("bbc.") || hostname.includes("bbcnews")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+data-testid=["'][^"']*image[^"']*["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+loading=["']eager["'][^>]*>/gi,
    )
  }

  if (hostname.includes("g1.globo.com") || hostname.includes("globo.com")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*content-media__image[^"']*["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+itemprop=["']image["'][^>]*>/gi,
    )
  }

  if (hostname.includes("uol.com.br")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*thumb[^"']*["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+itemprop=["']image["'][^>]*>/gi,
    )
  }

  if (hostname.includes("agenciabrasil.ebc.com.br")) {
    patterns.push(
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*img-fluid[^"']*["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+typeof=["']foaf:Image["'][^>]*>/gi,
    )
  }

  for (const pattern of patterns) {
    const candidate = extractImagesByPattern(html, pattern).find(Boolean)

    if (candidate) {
      return candidate
    }
  }

  return ""
}

function normalizeText(value: string) {
  return normalizeEncoding(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function looksMostlyEnglish(value: string) {
  const normalized = normalizeText(value)
  return /( the | with | after | says | warns | live | could | would | next | little | arrives | wrong | crisis )/.test(
    ` ${normalized} `,
  )
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
}

function extractTitleEntities(value: string) {
  const entities = value.match(/\b([A-ZÀ-Ý][\p{L}\-']+(?:\s+[A-ZÀ-Ý][\p{L}\-']+)*)/gu) ?? []
  return [...new Set(entities.map((entity) => entity.trim()).filter((entity) => entity.length > 2))]
}

function buildWikimediaQueries(article: { titulo: string; descricao: string; categoria: string }) {
  const normalizedTitle = normalizeEncoding(article.titulo)
  const entities = extractTitleEntities(normalizedTitle)
  const titleWords = normalizedTitle
    .split(/[^\p{L}\p{N}\-]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length > 3)

  const categoryHints =
    article.categoria === "Conflitos"
      ? ["war", "conflict", "military"]
      : article.categoria === "Política"
        ? ["politics", "government", "diplomacy"]
        : article.categoria === "Economia Global"
          ? ["economy", "oil", "energy"]
          : article.categoria === "Exploração Espacial"
            ? ["space exploration", "NASA", "Moon"]
            : article.categoria === "História"
              ? ["history", "historical event", "ancient world"]
              : ["geopolitics", "world affairs"]

  const rawQueries = [
    normalizedTitle,
    ...entities,
    ...entities.map((entity) => `${entity} ${article.categoria}`),
    titleWords.slice(0, 4).join(" "),
    ...categoryHints,
  ]

  return [...new Set(rawQueries.map((query) => query.replace(/\s+/g, " ").trim()).filter((query) => query.length >= 4))].slice(0, 6)
}

function buildSemanticFallbackQueries(article: { titulo: string; descricao: string; categoria: string }) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`)
  const queries: string[] = []

  if (/(iran|iranian|hormuz|persian gulf|gulf|tehran|bandar abbas|port)/.test(text)) {
    queries.push("Iran port", "Bandar Abbas", "Strait of Hormuz", "Persian Gulf")
  }

  if (/(ukraine|ukrainian|putin|russia|russian|moscow|kyiv|hungary|orban|peter magyar)/.test(text)) {
    queries.push("Ukraine", "Volodymyr Zelenskyy", "Viktor Orban", "Peter Magyar", "Russia Ukraine war")
  }

  if (/(european union|eu |europeu|uniao europeia|tariff|tarifa|steel|aco|commission|brussels)/.test(text)) {
    queries.push("European Commission", "European Union", "steel mill", "Brussels")
  }

  if (/(trump|white house|united states|us president|washington)/.test(text)) {
    queries.push("Donald Trump", "White House", "United States Capitol")
  }

  if (/(united nations|onu|security council|diplomac|assembly)/.test(text)) {
    queries.push("United Nations Headquarters", "United Nations Security Council", "UN General Assembly")
  }

  if (/(guerra|war|conflict|missile|troops|naval|blockade|military)/.test(text)) {
    queries.push("military ship", "naval ship", "conflict zone")
  }

  if (queries.length === 0 && article.categoria === "Conflitos") {
    queries.push("conflict zone", "military ship")
  }

  if (queries.length === 0 && article.categoria === "Politica") {
    queries.push("parliament", "government building")
  }

  return [...new Set(queries)].slice(0, 6)
}

function buildImageHintCacheKey(article: ImageHintArticle) {
  return normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`)
}

async function requestOpenAIImageHints(article: ImageHintArticle) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  const cacheKey = buildImageHintCacheKey(article)
  const cached = imageHintCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const pending = (async () => {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_IMAGE_HINT_MODEL,
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
                  searchQueries: {
                    type: "array",
                    items: { type: "string" },
                  },
                  theme: { type: "string" },
                },
                required: ["searchQueries", "theme"],
              },
            },
          },
          messages: [
            {
              role: "system",
              content:
                "Voce escolhe pistas de busca para imagens editoriais de noticias. Use apenas titulo, resumo e categoria fornecidos. Nao invente fatos novos. Retorne de 3 a 5 consultas curtas e especificas, adequadas para buscar imagem no Wikimedia. Priorize entidades reais, lugares, organizacoes e temas centrais da noticia. Evite termos genericos como world map ou geopolitics quando houver algo mais especifico.",
            },
            {
              role: "user",
              content: JSON.stringify(article),
            },
          ],
        }),
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const rawContent = data.choices?.[0]?.message?.content

      if (!rawContent) {
        return null
      }

      const parsed = JSON.parse(rawContent) as OpenAIImageHintResponse

      return {
        searchQueries: [...new Set((parsed.searchQueries ?? []).map((query) => normalizeEncoding(query).trim()).filter((query) => query.length >= 3))].slice(0, 5),
        theme: normalizeEncoding(parsed.theme ?? "").trim(),
      }
    } catch {
      return null
    }
  })()

  imageHintCache.set(cacheKey, pending)
  return pending
}

function sanitizeHtml(html: string) {
  return normalizeEncoding(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<picture[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<source[^>]*>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<a[^>]*>\s*(leia mais|read more|continue reading)[\s\S]*?<\/a>/gi, "")
    .replace(/<p>\s*(leia mais|read more|continue reading)[\s\S]*?<\/p>/gi, "")
    .replace(/<div[^>]*class="[^"]*(advert|promo|banner)[^"]*"[\s\S]*?<\/div>/gi, "")
    .trim()
}

function cleanFeedText(text: string) {
  return normalizeEncoding(text)
    .replace(/\uFFFD/g, "")
    .replace(/(?:veja os v[íi]deos[^.]*\.)/gi, "")
    .replace(/(?:mande para o g1[^.]*\.)/gi, "")
    .replace(/(?:tem alguma sugest[aã]o de reportagem[^.]*\.)/gi, "")
    .replace(/(?:clique aqui para seguir[^.]*\.)/gi, "")
    .replace(/(?:leia mais no site original\.?)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function paragraphizeText(text: string) {
  const normalized = cleanFeedText(text)

  if (!normalized) {
    return []
  }

  const rawBlocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const paragraphs: string[] = []

  for (const block of rawBlocks) {
    if (block.length <= 360) {
      paragraphs.push(block)
      continue
    }

    const sentences = block
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9"])/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)

    if (sentences.length <= 1) {
      paragraphs.push(block)
      continue
    }

    let currentParagraph = ""

    for (const sentence of sentences) {
      const nextParagraph = currentParagraph ? `${currentParagraph} ${sentence}` : sentence

      if (nextParagraph.length > 420 && currentParagraph) {
        paragraphs.push(currentParagraph)
        currentParagraph = sentence
        continue
      }

      currentParagraph = nextParagraph
    }

    if (currentParagraph) {
      paragraphs.push(currentParagraph)
    }
  }

  return paragraphs
}

function extractParagraphText(html: string) {
  const clean = sanitizeHtml(html)
  if (!clean) {
    return ""
  }

  const text = clean
    .replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, " ")

  return paragraphizeText(text).join("\n\n")
}

function textToHtmlParagraphs(text: string) {
  return paragraphizeText(text)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("")
}

function htmlToParagraphs(html: string) {
  const clean = sanitizeHtml(html)
  if (!clean) {
    return ""
  }

  const paragraphs = clean
    .replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  return paragraphs.join("\n\n")
}

function buildHtmlFromText(text: string) {
  return text
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("")
}

function clipText(text: string, maxLength: number) {
  const normalized = normalizeEncoding(text).replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

async function localizeRssTeaser(article: { titulo: string; descricao: string; categoria: string; fonte: string }) {
  const sourceText = `${article.titulo} ${article.descricao}`

  if (!looksMostlyEnglish(sourceText)) {
    return {
      titulo: article.titulo,
      descricao: article.descricao,
    }
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      titulo: article.titulo,
      descricao: article.descricao,
    }
  }

  const cacheKey = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria} ${article.fonte}`)
  const cached = localizationCache.get(cacheKey)

  if (cached) {
    return (await cached) ?? { titulo: article.titulo, descricao: article.descricao }
  }

  const pending = (async () => {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_IMAGE_HINT_MODEL,
          temperature: 0.2,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "localized_rss_teaser",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                },
                required: ["titulo", "descricao"],
              },
            },
          },
          messages: [
            {
              role: "system",
              content:
                "Voce e editor de um portal brasileiro. Traduza e adapte para portugues do Brasil o titulo e o resumo de uma noticia internacional. Use apenas as informacoes fornecidas. Nao invente fatos. O titulo deve soar natural em portal jornalistico. O resumo deve ficar claro e conciso, com no maximo duas frases curtas.",
            },
            {
              role: "user",
              content: JSON.stringify(article),
            },
          ],
        }),
        signal: AbortSignal.timeout(7000),
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const rawContent = data.choices?.[0]?.message?.content

      if (!rawContent) {
        return null
      }

      const parsed = JSON.parse(rawContent) as { titulo: string; descricao: string }
      return {
        titulo: normalizeEncoding(parsed.titulo).trim() || article.titulo,
        descricao: normalizeEncoding(parsed.descricao).trim() || article.descricao,
      }
    } catch {
      return null
    }
  })()

  localizationCache.set(cacheKey, pending)

  return (await pending) ?? {
    titulo: article.titulo,
    descricao: article.descricao,
  }
}

function normalizeImageUrl(url?: string) {
  if (!url) {
    return ""
  }

  const normalized = decodeEntities(url).trim()

  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/")) {
    return ""
  }

  if (/(logo|icon|favicon|avatar|sprite)/i.test(normalized)) {
    return ""
  }

  if (/(flag_of|seal_of|coat_of_arms|locator_map|blank_map|orthographic|relief_location)/i.test(normalized)) {
    return ""
  }

  if (/w16|w24|w32|w48/i.test(normalized)) {
    return ""
  }

  return normalized
    .replace(/([?&])(width|w)=\d+/gi, "$1$2=1600")
    .replace(/([?&])(height|h)=\d+/gi, "$1$2=900")
    .replace(/([?&])(quality|q)=\d+/gi, "$1$2=90")
}

function extractImage(item: string, html: string) {
  return [
    extractAttribute(item, "media:content", "url"),
    extractAttribute(item, "media:thumbnail", "url"),
    extractAttribute(item, "enclosure", "url"),
    extractAttribute(html, "img", "src"),
  ]
    .map((candidate) => normalizeImageUrl(candidate))
    .find(Boolean)
}

async function searchWikimediaImages(query: string): Promise<WikimediaImageCandidate[]> {
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

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "EventosHistoricosBot/1.0" },
      next: { revalidate: WIKIMEDIA_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as {
      query?: {
        pages?: Record<string, { title?: string; thumbnail?: { source?: string } }>
      }
    }

    const pages = Object.values(data.query?.pages ?? {})

    const ranked = pages
      .map((page) => {
        const imageUrl = normalizeImageUrl(page.thumbnail?.source)
        const pageTitle = normalizeText(page.title ?? "")
        let score = 0

        if (!imageUrl) {
          score = -100
        }

        if (pageTitle.includes(normalizeText(query))) {
          score += 40
        }

        if (/(ship|port|strait|gulf|commission|trump|ukraine|european union|brussels|iran)/.test(pageTitle)) {
          score += 18
        }

        if (/(flag|seal|map|locator|coat of arms)/.test(pageTitle)) {
          score -= 60
        }

        return { imageUrl, score }
      })
      .filter((entry) => entry.imageUrl)
      .sort((a, b) => b.score - a.score)

    return ranked
  } catch {
    return []
  }
}

async function fetchSourcePageImage(url?: string) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return ""
  }

  const cached = sourceImageCache.get(url)
  if (cached) {
    return cached
  }

  const pending = (async () => {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: FEED_REVALIDATE_SECONDS },
      })

      if (!response.ok) {
        return ""
      }

      const html = await response.text()
      const metaImage =
        extractMetaContent(html, "og:image") ||
        extractMetaContent(html, "twitter:image") ||
        extractMetaContent(html, "og:image:url")

      return normalizeImageUrl(metaImage) || extractSourceSpecificImage(html, url)
    } catch {
      return ""
    }
  })()

  sourceImageCache.set(url, pending)
  return pending
}

async function resolveArticleImage(article: { titulo: string; descricao: string; categoria: string; link?: string }, feedImage?: string) {
  const normalizedFeedImage = normalizeImageUrl(feedImage)

  if (normalizedFeedImage) {
    return normalizedFeedImage
  }

  const sourcePageImage = await fetchSourcePageImage(article.link)

  if (sourcePageImage) {
    return sourcePageImage
  }

  const aiHints = await requestOpenAIImageHints(article)
  const candidateQueries = [
    ...(aiHints?.searchQueries ?? []),
    ...buildSemanticFallbackQueries(article),
    ...buildWikimediaQueries(article),
    ...(aiHints?.theme ? [`${aiHints.theme} ${article.categoria}`] : []),
  ]

  const rankedCandidates: WikimediaImageCandidate[] = []
  const uniqueQueries = [...new Set(candidateQueries.map((value) => value.trim()).filter((value) => value.length >= 3))]

  for (const [index, query] of uniqueQueries.entries()) {
    const candidates = await searchWikimediaImages(query)

    for (const candidate of candidates.slice(0, 4)) {
      rankedCandidates.push({
        imageUrl: candidate.imageUrl,
        score: candidate.score + Math.max(0, 40 - index * 6),
      })
    }
  }

  const bestCandidate = rankedCandidates.sort((a, b) => b.score - a.score)[0]

  if (bestCandidate?.imageUrl) {
    return bestCandidate.imageUrl
  }

  return inferImage(article)
}

function isTruncated(text: string) {
  const normalized = normalizeText(text)
  return normalized.endsWith("...") || normalized.endsWith("…") || normalized.includes("[+") || normalized.includes("continue reading")
}

function inferCategory(article: ParsedFeedItem) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  const matchedRule = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))
  return matchedRule?.categoria ?? "Geopolítica"
}

function scoreArticle(article: ParsedFeedItem, categoria: string) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  const sourceScore = SOURCE_WEIGHTS[article.fonte] ?? 24
  const categoryScore =
    categoria === "Geopolítica"
      ? 40
      : categoria === "Conflitos"
        ? 38
        : categoria === "Política"
          ? 34
          : categoria === "Economia Global"
            ? 30
            : categoria === "Exploração Espacial"
              ? 28
              : 24

  const globalScore = GLOBAL_PRIORITY_KEYWORDS.filter((keyword) => text.includes(keyword)).length * 8
  const brazilGeneralScore = BRAZIL_GENERAL_KEYWORDS.filter((keyword) => text.includes(keyword)).length * -7
  const titleBonus = /(war|guerra|election|elei|crise|summit|coup|sanction|otan|onu|nasa|artemis)/.test(text) ? 12 : 0
  const articleDate = article.data ? new Date(article.data) : new Date()
  const ageHours = Number.isNaN(articleDate.getTime()) ? 9999 : (Date.now() - articleDate.getTime()) / 36e5
  const ageScore =
    ageHours <= 12
      ? 140
      : ageHours <= 24
        ? 115
        : ageHours <= 48
          ? 90
          : ageHours <= 72
            ? 70
            : ageHours <= 120
              ? 45
              : ageHours <= 168
                ? 25
                : ageHours <= 240
                  ? 10
                  : -20

  return sourceScore + categoryScore + globalScore + brazilGeneralScore + titleBonus + ageScore
}

function inferImage(article: { titulo: string; descricao: string; categoria: string }) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`)

  if (/(space|lua|artemis|nasa|moon|apollo|marte|astronaut)/.test(text)) {
    return "/historical-books-and-world-map-study.jpg"
  }
  if (/(guerra|war|conflit|attack|bomb|militar|oriente medio|border|troops)/.test(text)) {
    return "/world-map-with-geopolitical-tensions.jpg"
  }
  return "/geopolitics-world-map-with-news-overlay.jpg"
}

function buildRssSlug(item: ParsedFeedItem) {
  const parsedDate = item.data ? new Date(item.data) : new Date()
  const datePart = Number.isNaN(parsedDate.getTime()) ? "atual" : parsedDate.toISOString().slice(0, 10)
  return slugify(`${item.fonte}-${item.titulo}-${datePart}`)
}

function buildRssBody(article: ParsedFeedItem, categoria: string, resumo: boolean) {
  const extractedText = extractParagraphText(article.conteudoHtml || article.descricao)
  const baseText = extractedText || article.descricao || article.titulo
  const suffix = resumo
    ? `\n\nEste conteúdo é um resumo editorial gerado a partir do feed oficial de ${article.fonte}. Para ler a matéria completa, acesse o site original.`
    : `\n\nConteúdo exibido a partir do feed oficial de ${article.fonte}, dentro da curadoria de ${categoria} do Eventos Históricos.`

  return normalizeEncoding(`${baseText}${suffix}`).trim()
}

function buildRssHtml(article: ParsedFeedItem, categoria: string, resumo: boolean) {
  const extractedHtml = sanitizeHtml(article.conteudoHtml)
  if (extractedHtml) {
    const notice = resumo
      ? `<p><strong>Resumo editorial:</strong> este feed parece trazer apenas um trecho da publicação original de ${article.fonte}. Use o link oficial ao final da página para ler a matéria completa.</p>`
      : `<p><strong>Crédito editorial:</strong> conteúdo exibido a partir do feed oficial de ${article.fonte}, dentro da curadoria de ${categoria} do Eventos Históricos.</p>`

    return `${extractedHtml}${notice}`
  }

  return buildHtmlFromText(buildRssBody(article, categoria, resumo))
}

function buildStructuredRssHtml(article: ParsedFeedItem, categoria: string, resumo: boolean) {
  const baseText = extractParagraphText(article.conteudoHtml || article.descricao) || article.descricao || article.titulo
  const notice = resumo
    ? `<p><strong>Resumo editorial:</strong> este feed parece trazer apenas um trecho da publicação original de ${article.fonte}. Use o link oficial ao final da página para ler a matéria completa.</p>`
    : `<p><strong>Crédito editorial:</strong> conteúdo exibido a partir do feed oficial de ${article.fonte}, dentro da curadoria de ${categoria} do Eventos Históricos.</p>`

  return `${textToHtmlParagraphs(baseText)}${notice}`
}

function isRelevantArticle(article: ParsedFeedItem) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  const hasRelevantKeyword = RELEVANT_KEYWORDS.some((keyword) => text.includes(keyword))
  const hasNegativeKeyword = NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))
  return hasRelevantKeyword && !hasNegativeKeyword
}

function parseRssItems(xml: string, feedName: string) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []

  return items
    .map((item) => {
      const titulo = stripTags(extractTag(item, "title"))
      const link = stripTags(extractTag(item, "link"))
      const contentEncoded = extractTag(item, "content:encoded")
      const description = extractTag(item, "description")
      const data = stripTags(extractTag(item, "pubDate"))
      const fonte = stripTags(extractTag(item, "source")) || feedName
      const conteudoHtml = sanitizeHtml(contentEncoded || description)
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
      }
    })
    .filter((item) => item.titulo && item.link)
}

async function fetchFeed(url: string, name: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: FEED_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      return []
    }

    const xml = await response.text()
    return parseRssItems(xml, name)
  } catch {
    return []
  }
}

export function renderSafeArticleHtml(html: string) {
  return sanitizeHtml(html)
}

export function isGenericFallbackImage(src?: string) {
  return Boolean(src && GENERIC_FALLBACK_IMAGES.has(src))
}

export function hasContextualImage(article: Pick<SiteNewsArticle, "imagem" | "tipo">) {
  if (!article.imagem) {
    return false
  }

  return article.tipo !== "rss" || !isGenericFallbackImage(article.imagem)
}

function estimateAnalysisArticleScore(article: Pick<SiteNewsArticle, "titulo" | "descricao" | "categoria" | "data" | "fonte">) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria} ${article.fonte}`)
  const categoryBonus =
    article.categoria === "Conflitos"
      ? 36
      : article.categoria === "GeopolÃ­tica"
        ? 34
        : article.categoria === "Economia Global"
          ? 30
          : article.categoria === "PolÃ­tica"
            ? 28
            : article.categoria === "ExploraÃ§Ã£o Espacial"
              ? 26
              : 20

  const globalBonus = GLOBAL_PRIORITY_KEYWORDS.filter((keyword) => text.includes(keyword)).length * 7
  const articleDate = article.data ? new Date(article.data) : new Date()
  const ageHours = Number.isNaN(articleDate.getTime()) ? 9999 : (Date.now() - articleDate.getTime()) / 36e5
  const ageScore = ageHours <= 24 ? 80 : ageHours <= 72 ? 55 : ageHours <= 120 ? 28 : 8

  return categoryBonus + globalBonus + ageScore
}

function groupArticlesByTheme(rssArticles: SiteNewsArticle[]) {
  const groups = PORTAL_ANALYSIS_THEMES.map((theme) => {
    const articles = rssArticles.filter((article) => {
      const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria} ${article.tags.join(" ")}`)
      return theme.keywords.some((keyword) => text.includes(keyword))
    })

    const averageScore =
      articles.length > 0
        ? articles.reduce((total, article) => total + estimateAnalysisArticleScore(article), 0) / articles.length
        : 0

    return {
      theme,
      articles,
      averageScore,
    } satisfies PortalAnalysisGroup
  })

  return groups.filter((group) => group.articles.length > 0)
}

export function shouldGeneratePortalAnalysis(group: PortalAnalysisGroup) {
  return group.articles.length >= 3 && group.averageScore >= 70
}

function buildPortalAnalysisHtml(input: {
  analysisPt: string
  globalImpactPt: string
  historicalContextPt?: string
  editorialNotePt: string
}) {
  const sections = [
    ...input.analysisPt
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph}</p>`),
    `<section><h2>Impacto global</h2>${input.globalImpactPt
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("")}</section>`,
    input.historicalContextPt
      ? `<section><h2>Contexto historico</h2>${input.historicalContextPt
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("")}</section>`
      : "",
    `<p><em>${input.editorialNotePt}</em></p>`,
  ]

  return sections.filter(Boolean).join("")
}

async function generatePortalAnalysesFromRss(rssArticles: SiteNewsArticle[]) {
  const strongGroups = groupArticlesByTheme(rssArticles)
    .filter(shouldGeneratePortalAnalysis)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3)

  const analyses = await Promise.all(
    strongGroups.map(async (group, index) => {
      const generated = await generatePortalAnalysis({
        themeId: group.theme.id,
        themeLabel: group.theme.label,
        category: group.theme.category,
        tags: group.theme.tags,
        sourceArticles: group.articles.slice(0, 5).map((article) => ({
          titulo: article.titulo,
          descricao: article.descricao,
          fonte: article.fonte,
          data: article.data,
          categoria: article.categoria,
          linkFonte: article.linkFonte,
        })),
      })

      const latestDate = group.articles
        .map((article) => new Date(article.data).getTime())
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => b - a)[0]

      const slug = slugify(`analise-${group.theme.id}-${latestDate || Date.now()}`)
      const imageFromGroup = group.articles.find(hasContextualImage)?.imagem || group.theme.image

      return {
        id: `analysis-${group.theme.id}-${index}`,
        slug,
        titulo: generated.titlePt,
        descricao: clipText(generated.summaryPt, 220),
        conteudo: `${generated.analysisPt}\n\n${generated.globalImpactPt}${generated.historicalContextPt ? `\n\n${generated.historicalContextPt}` : ""}\n\n${generated.editorialNotePt}`,
        conteudoHtml: buildPortalAnalysisHtml(generated),
        resumo: false,
        data: latestDate ? new Date(latestDate).toISOString() : new Date().toISOString(),
        categoria: group.theme.category,
        fonte: "Eventos Historicos",
        fonteUrl: group.articles[0]?.linkFonte,
        linkFonte: group.articles[0]?.linkFonte,
        imagem: imageFromGroup,
        tags: [...new Set([...group.theme.tags, ...group.articles.flatMap((article) => article.tags).slice(0, 4)])],
        href: `/noticias/${slug}`,
        externo: false,
        tipo: "analysis" as const,
      } satisfies SiteNewsArticle
    }),
  )

  return analyses
}

export async function getRssNews(limit = 20): Promise<SiteNewsArticle[]> {
  const results = await Promise.all(RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.name)))
  const seen = new Set<string>()

  const articles = await Promise.all(
    results
      .flat()
    .filter(isRelevantArticle)
    .filter((item) => {
      const key = normalizeText(`${item.titulo}-${item.link}`)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .filter((item) => {
      const categoria = inferCategory(item)
      const parsedDate = item.data ? new Date(item.data) : new Date()
      if (Number.isNaN(parsedDate.getTime())) {
        return false
      }

      const ageDays = (Date.now() - parsedDate.getTime()) / 86_400_000
      const maxAge = categoria === "História" ? MAX_HISTORY_AGE_DAYS : MAX_NEWS_AGE_DAYS
      return ageDays <= maxAge
    })
    .map(async (item) => {
      const categoria = inferCategory(item)
      const parsedDate = item.data ? new Date(item.data) : new Date()
      const data = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
      const slug = buildRssSlug(item)
      const resumo = isTruncated(item.descricao) || !item.conteudoHtml || item.conteudoHtml.length < 280
      const conteudo = buildRssBody(item, categoria, resumo)
      const conteudoHtml = buildStructuredRssHtml(item, categoria, resumo)
      const score = scoreArticle(item, categoria)
      const imagem = await resolveArticleImage({ ...item, categoria, link: item.link }, item.imagem)
      const localized = await localizeRssTeaser({
        titulo: item.titulo,
        descricao: item.descricao,
        categoria,
        fonte: item.fonte,
      })

      return {
        score,
        id: `rss-${slug}`,
        slug,
        titulo: localized.titulo,
        descricao: clipText(localized.descricao || "Resumo selecionado automaticamente a partir de feeds abertos e confiaveis.", 220),
        conteudo,
        conteudoHtml,
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
        tipo: "rss" as const,
      }
    }),
  )

  return articles
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return new Date(b.data).getTime() - new Date(a.data).getTime()
    })
    .slice(0, limit)
    .map(({ score: _score, ...article }) => article satisfies SiteNewsArticle)
}

function normalizeLocalArticles(): SiteNewsArticle[] {
  return [...noticiasData]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map((article) => ({
      id: article.id,
      slug: article.slug,
      titulo: normalizeEncoding(article.titulo),
      descricao: clipText(normalizeEncoding(article.descricao), 220),
      conteudo: normalizeEncoding(article.conteudo),
      conteudoHtml: buildHtmlFromText(normalizeEncoding(article.conteudo)),
      resumo: false,
      data: article.data,
      categoria: normalizeEncoding(article.categoria),
      autor: article.autor ? normalizeEncoding(article.autor) : undefined,
      fonte: normalizeEncoding(article.fonte || "Eventos Históricos"),
      fonteUrl: article.linkFonte,
      linkFonte: article.linkFonte,
      imagem: article.imagem || inferImage(article),
      tags: article.tags ?? [],
      href: `/noticias/${article.slug}`,
      externo: false,
      tipo: "analysis" as const,
    }))
}

export async function getCuratedNews(limit = 20) {
  const rssArticles = await getRssNews(limit)
  const generatedAnalyses = await generatePortalAnalysesFromRss(rssArticles)
  const localArticles = [...generatedAnalyses, ...normalizeLocalArticles()]

  return {
    rssArticles,
    localArticles,
    combinedArticles: rssArticles.length > 0 ? [...rssArticles, ...localArticles] : localArticles,
  }
}

export async function getNewsArticleBySlug(slug: string) {
  const { rssArticles, localArticles } = await getCuratedNews(30)
  const localArticle = localArticles.find((article) => article.slug === slug)

  if (localArticle) {
    return localArticle
  }

  return rssArticles.find((article) => article.slug === slug)
}

export async function getRelatedNews(currentSlug: string, limit = 2) {
  const { combinedArticles } = await getCuratedNews(12)
  return combinedArticles.filter((article) => article.slug !== currentSlug).slice(0, limit)
}

export function formatNewsDate(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Atualização recente"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate)
}
