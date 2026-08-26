import noticiasData from "@/data/noticias.json"
import { generatePortalAnalysis } from "@/lib/news-editorial"
import { translateToPortuguese } from "@/lib/deepl"
import { getCachedRssArticles, setCachedRssArticles, getCachedArticleBySlug, setCachedArticleBySlug } from "@/lib/redis-cache"

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
  idioma: "pt" | "en"
  noticeHtml: string
  tituloOriginal?: string
  descricaoOriginal?: string
  conteudoOriginal?: string
}

interface ParsedFeedItem {
  titulo: string
  descricao: string
  conteudoHtml: string
  data: string
  fonte: string
  link: string
  imagem?: string
  truncated: boolean
}

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
const sourcePageHtmlCache = new Map<string, Promise<string>>()

const JUNK_PARAGRAPH_PATTERN =
  /(cookie|assine|inscreva-se|newsletter|publicidade|advertisement|compartilhe esta|leia tamb[ée]m|veja tamb[ée]m|siga o |siga a |clique aqui|todos os direitos reservados|copyright ©|sign up|subscribe|related:|read more:|leia mais:|^listen\b|save share|share-nodes|whatsapp-stroke|copylink|caret-right|add .+ on google|download our app|follow us|^by [a-z .]+$|min read|mins read|\bfacebook\b.*\bx\b.*\bwhatsapp\b|recommended stories|^list \d+ of \d+|end of list)/i

const SENTENCE_END_PATTERN = /[.!?"'”)]\s*$/

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
  {
    categoria: "Exploração Espacial",
    keywords: ["artemis", "nasa", "spacex", "space mission", "space program", "space exploration", "space flight", "space station", "orbita", "marte", "astronaut", "rocket launch", "moon landing", "lunar mission"],
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
  const normalized = ` ${normalizeText(value)} `
  // Common English function words — if any appear as whole words the text is English.
  // Kept broad so short titles ("Gaza ceasefire deal reached") are also caught.
  return /\b(the|a|an|is|are|was|were|be|been|of|in|on|to|for|and|but|or|with|by|at|from|as|it|its|this|that|he|she|they|we|you|who|which|has|have|had|will|would|can|could|should|may|might|must|not|no|up|out|if|so|than|then|after|before|over|under|about|into|through|says|said|warns|calls|reports|amid|despite|against|during|while|when|where|how|new|more|last|first|their|our|his|her|us|uk)\b/.test(
    normalized,
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

async function fetchSourcePageHtml(url?: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return ""
  }

  const cached = sourcePageHtmlCache.get(url)
  if (cached) {
    return cached
  }

  const pending = (async () => {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      })

      if (!response.ok) {
        return ""
      }

      return await response.text()
    } catch {
      return ""
    }
  })()

  sourcePageHtmlCache.set(url, pending)
  return pending
}

async function fetchSourcePageImage(url?: string) {
  const html = await fetchSourcePageHtml(url)

  if (!html) {
    return ""
  }

  const metaImage =
    extractMetaContent(html, "og:image") ||
    extractMetaContent(html, "twitter:image") ||
    extractMetaContent(html, "og:image:url")

  return normalizeImageUrl(metaImage) || extractSourceSpecificImage(html, url ?? "")
}

function extractMainArticleHtml(html: string) {
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  return articleMatch ? articleMatch[1] : html
}

function stripBylineBoilerplate(paragraph: string) {
  return paragraph
    .replace(/last modified on[\s\S]*?\b(am|pm|edt|gmt|bst|utc)\b\.?/gi, "")
    .replace(/\bshare prefer the [a-z0-9 ]+ on google\b/gi, "")
    .replace(/\b(mon|tue|wed|thu|fri|sat|sun)\s+\d{1,2}\s+[a-z]+\s+\d{4}\s+\d{1,2}[:.]\d{2}\s*(am|pm|edt|gmt|bst|utc)?/gi, "")
    .replace(/recommended stories[\s\S]*?end of list/gi, "")
    .replace(/\blist \d+ of \d+\b/gi, "")
    .replace(/•\s*[^.!?]{0,140}\?(?=\s|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

async function fetchSourceArticleText(url?: string): Promise<string> {
  const html = await fetchSourcePageHtml(url)

  if (!html) {
    return ""
  }

  const cleanHtml = sanitizeHtml(extractMainArticleHtml(html))
  const paragraphs = extractParagraphText(cleanHtml)
    .split(/\n\s*\n/)
    .map((paragraph) => stripBylineBoilerplate(paragraph.trim()))
    .filter(Boolean)
    .filter((paragraph) => !JUNK_PARAGRAPH_PATTERN.test(paragraph))
    .filter((paragraph) => {
      const wordCount = paragraph.split(/\s+/).filter(Boolean).length
      if (wordCount < 6) return false
      if (paragraph.length < 200 && !SENTENCE_END_PATTERN.test(paragraph)) return false
      return true
    })

  const selected: string[] = []
  let totalLength = 0

  for (const paragraph of paragraphs) {
    if (totalLength >= 2200) {
      break
    }
    selected.push(paragraph)
    totalLength += paragraph.length
  }

  const text = selected.join("\n\n")
  return text.length >= 400 ? text : ""
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

  const uniqueQueries = [...new Set(candidateQueries.map((value) => value.trim()).filter((value) => value.length >= 3))].slice(0, 4)

  const allResults = await Promise.all(uniqueQueries.map(searchWikimediaImages))
  const rankedCandidates: WikimediaImageCandidate[] = allResults.flatMap((candidates, index) =>
    candidates.slice(0, 4).map((candidate) => ({
      imageUrl: candidate.imageUrl,
      score: candidate.score + Math.max(0, 40 - index * 10),
    }))
  )

  const bestCandidate = rankedCandidates.sort((a, b) => b.score - a.score)[0]

  if (bestCandidate?.imageUrl) {
    return bestCandidate.imageUrl
  }

  return inferImage(article)
}

const articleExpansionCache = new Map<string, Promise<string>>()

async function expandArticleWithAI(article: {
  titulo: string
  descricao: string
  categoria: string
  fonte: string
  contexto?: string
}): Promise<string> {
  const fallback = article.contexto?.trim() || article.descricao
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback

  const cacheKey = normalizeText(`${article.titulo}${article.fonte}`)
  const cached = articleExpansionCache.get(cacheKey)
  if (cached) return cached

  const pending = (async (): Promise<string> => {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_EDITORIAL_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "Você é editor de um portal brasileiro de geopolítica e história. Com base no título, resumo e contexto adicional de uma notícia internacional, escreva um artigo informativo em português do Brasil com 3 a 4 parágrafos bem desenvolvidos. Mantenha-se fiel aos fatos apresentados. Não invente informações que não estejam no contexto fornecido. Escreva de forma clara, objetiva e jornalística. Separe os parágrafos com duas quebras de linha. Não inclua título nem cabeçalho, apenas os parágrafos.",
            },
            {
              role: "user",
              content: `Título: ${article.titulo}\nResumo: ${article.descricao}\nContexto adicional do feed: ${article.contexto || "(nenhum)"}\nCategoria: ${article.categoria}\nFonte: ${article.fonte}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      })

      if (!response.ok) return fallback
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content?.trim()
      return content ? normalizeEncoding(content) : fallback
    } catch {
      return fallback
    }
  })()

  articleExpansionCache.set(cacheKey, pending)
  return pending
}

function isTruncated(text: string) {
  const normalized = normalizeText(text)
  return normalized.endsWith("...") || normalized.endsWith("…") || normalized.includes("[+") || normalized.includes("continue reading")
}

function inferCategory(article: ParsedFeedItem) {
  if (HISTORY_SOURCES.has(article.fonte)) return "História"
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


function isRelevantArticle(article: ParsedFeedItem) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`)
  const hasRelevantKeyword = RELEVANT_KEYWORDS.some((keyword) => text.includes(keyword))
  const hasNegativeKeyword = NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))
  return hasRelevantKeyword && !hasNegativeKeyword
}

function hasTruncationMarker(rawHtml: string) {
  const normalized = normalizeText(decodeEntities(rawHtml))
  return (
    /(continue reading|read more|leia mais|saiba mais|veja mais)\s*(\.\.\.)?\s*(<\/a>)?\s*$/.test(normalized.trim()) ||
    /\[\+\d+\s*chars?\]/.test(normalized) ||
    normalized.trim().endsWith("...") ||
    normalized.trim().endsWith("…")
  )
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
      const rawSource = contentEncoded || description
      const conteudoHtml = sanitizeHtml(rawSource)
      const descricao = extractParagraphText(description || contentEncoded).split(/\n\s*\n/)[0] || titulo
      const imagem = extractImage(item, contentEncoded || description)
      const truncated = hasTruncationMarker(rawSource)

      return {
        titulo: normalizeEncoding(titulo),
        descricao: normalizeEncoding(descricao),
        conteudoHtml,
        data,
        fonte: normalizeEncoding(fonte),
        link,
        imagem,
        truncated,
      }
    })
    .filter((item) => item.titulo && item.link)
}

async function fetchFeed(url: string, name: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
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
        autor: "Redacao Eventos Historicos",
        fonte: "Analise do portal",
        fonteUrl: undefined,
        linkFonte: undefined,
        imagem: imageFromGroup,
        tags: [...new Set([...group.theme.tags, ...group.articles.flatMap((article) => article.tags).slice(0, 4)])],
        href: `/noticias/${slug}`,
        externo: false,
        tipo: "analysis" as const,
        idioma: "pt" as const,
        noticeHtml: "",
      } satisfies SiteNewsArticle
    }),
  )

  return analyses
}

function buildScoredCandidate(item: ParsedFeedItem) {
  const categoria = inferCategory(item)
  const parsedDate = item.data ? new Date(item.data) : new Date()

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  const ageDays = (Date.now() - parsedDate.getTime()) / 86_400_000
  const maxAge = categoria === "História" ? MAX_HISTORY_AGE_DAYS : MAX_NEWS_AGE_DAYS

  if (ageDays > maxAge) {
    return null
  }

  return {
    item,
    categoria,
    score: scoreArticle(item, categoria),
    data: parsedDate.toISOString(),
  }
}

async function hydrateScoredCandidate(
  candidate: NonNullable<ReturnType<typeof buildScoredCandidate>>,
  full = false,
  imageTimeoutMs = 3000,
): Promise<SiteNewsArticle> {
  const { item, categoria, data } = candidate
  const slug = buildRssSlug(item)
  const resumo = item.truncated || isTruncated(item.descricao) || !item.conteudoHtml || item.conteudoHtml.length < 600
  // All RSS feeds are English-language sources — always translate.
  const isEnglish = true
  const rawText = extractParagraphText(item.conteudoHtml || item.descricao) || item.descricao || item.titulo

  // Card lists only ever show titulo/descricao (grep confirms `conteudo` is only
  // read on the single-article page) — translating the full body for every item
  // in a 20-article list was the main source of slowness, made worse once body
  // translation had to go paragraph-by-paragraph to preserve line breaks. Only
  // pay for that when `full` is requested for the one article being opened.
  const imageFallback = inferImage({ ...item, categoria })
  const [imagem, translatedTitle, translatedDesc, translatedRawText] = await Promise.all([
    Promise.race([
      resolveArticleImage({ ...item, categoria, link: item.link }, item.imagem),
      new Promise<string>((resolve) => setTimeout(() => resolve(imageFallback), imageTimeoutMs)),
    ]),
    isEnglish ? translateToPortuguese(item.titulo) : Promise.resolve(item.titulo),
    isEnglish ? translateToPortuguese(item.descricao) : Promise.resolve(item.descricao),
    full && isEnglish ? translateToPortuguese(rawText) : Promise.resolve(rawText),
  ])

  const articleBody = translatedRawText
  const notice = `<p><em>Conteúdo do feed oficial de <strong>${item.fonte}</strong>, curado pelo Eventos Históricos.</em></p>`
  const conteudoHtml = `${textToHtmlParagraphs(articleBody)}${notice}`
  const conteudo = articleBody

  return {
    id: `rss-${slug}`,
    slug,
    titulo: translatedTitle,
    descricao: clipText(translatedDesc || "Resumo selecionado automaticamente a partir de feeds abertos e confiáveis.", 220),
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
    idioma: isEnglish ? "en" : "pt",
    noticeHtml: notice,
    tituloOriginal: isEnglish ? item.titulo : undefined,
    descricaoOriginal: isEnglish ? item.descricao : undefined,
    conteudoOriginal: isEnglish ? rawText : undefined,
  }
}

async function getAllScoredCandidates() {
  const results = await Promise.all(RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.name)))
  const seen = new Set<string>()

  return results
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
    .map(buildScoredCandidate)
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
}

let rssCache: { articles: SiteNewsArticle[]; at: number } | null = null
const RSS_CACHE_TTL = 90_000

export async function refreshRssCache(): Promise<SiteNewsArticle[]> {
  const candidates = (await getAllScoredCandidates())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.data).getTime() - new Date(a.data).getTime()
    })
    .slice(0, 20)

  // Basic hydration for the list/card cache (no full body translation)
  const articles = await Promise.all(candidates.map((candidate) => hydrateScoredCandidate(candidate)))
  rssCache = { articles, at: Date.now() }
  await setCachedRssArticles(articles)

  // Pre-warm per-slug cache with full content so the first visitor gets a fast
  // response. Run all in parallel; cap the whole phase at 22s so the Lambda
  // stays within its execution budget even if some sources are slow.
  await Promise.race([
    Promise.allSettled(
      candidates.map(async (candidate) => {
        // 8s image timeout in background cron — allows OG image scraping to complete
        const hydrated = await hydrateScoredCandidate(candidate, true, 8000)
        const enriched = await enrichArticleWithFullText(hydrated)
        await setCachedArticleBySlug(enriched.slug, enriched)
      }),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, 22_000)),
  ])

  return articles
}

export async function getRssNews(limit = 20): Promise<SiteNewsArticle[]> {
  const now = Date.now()

  // 1. In-memory cache (warm Lambda, fastest — ~0ms)
  if (rssCache && now - rssCache.at < RSS_CACHE_TTL) {
    return rssCache.articles.slice(0, limit)
  }

  // 2. Redis cache (cold Lambda, persists across restarts — ~5-20ms)
  const redisArticles = await getCachedRssArticles()
  if (redisArticles && redisArticles.length > 0) {
    rssCache = { articles: redisArticles, at: now }
    return redisArticles.slice(0, limit)
  }

  // 3. Full fetch (first visit or after 1h TTL expiry — ~5-6s)
  const candidates = (await getAllScoredCandidates())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.data).getTime() - new Date(a.data).getTime()
    })
    .slice(0, limit)

  const articles = await Promise.all(candidates.map((candidate) => hydrateScoredCandidate(candidate)))
  rssCache = { articles, at: now }

  // Store in Redis without blocking the response
  setCachedRssArticles(articles).catch(() => {})

  return articles
}

async function findScoredCandidateBySlug(slug: string) {
  const candidates = await getAllScoredCandidates()
  return candidates.find((candidate) => buildRssSlug(candidate.item) === slug) ?? null
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
      idioma: "pt" as const,
      noticeHtml: "",
    }))
}

type CuratedNewsResult = {
  rssArticles: SiteNewsArticle[]
  localArticles: SiteNewsArticle[]
  combinedArticles: SiteNewsArticle[]
}

let curatedCache: { data: CuratedNewsResult; at: number } | null = null
const CURATED_CACHE_TTL = 90_000

export async function getCuratedNews(limit = 20): Promise<CuratedNewsResult> {
  const now = Date.now()
  if (curatedCache && now - curatedCache.at < CURATED_CACHE_TTL) {
    return curatedCache.data
  }

  const rssArticles = await getRssNews(limit)

  // Cap analyses at 8s — if OpenAI is slow, skip and serve articles now
  const generatedAnalyses = await Promise.race([
    generatePortalAnalysesFromRss(rssArticles),
    new Promise<SiteNewsArticle[]>((resolve) => setTimeout(() => resolve([]), 8000)),
  ])

  const localArticles = [...generatedAnalyses, ...normalizeLocalArticles()]
  const data: CuratedNewsResult = {
    rssArticles,
    localArticles,
    combinedArticles: rssArticles.length > 0 ? [...rssArticles, ...localArticles] : localArticles,
  }

  curatedCache = { data, at: now }
  return data
}

async function enrichArticleWithFullText(article: SiteNewsArticle): Promise<SiteNewsArticle> {
  if (article.tipo !== "rss" || !article.resumo) {
    return article
  }

  const sourceLink = article.linkFonte || article.fonteUrl
  const scrapedText = await fetchSourceArticleText(sourceLink)

  let body = ""
  let bodyOriginal: string | undefined
  let bodySource: "scraped" | "ai" = "scraped"

  if (scrapedText && scrapedText.length > article.conteudo.length + 200) {
    const scrapedIsEnglish = looksMostlyEnglish(scrapedText)
    body = scrapedIsEnglish ? await translateToPortuguese(scrapedText) : scrapedText
    bodyOriginal = scrapedIsEnglish ? scrapedText : undefined
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
      return article
    }

    body = aiText
    bodySource = "ai"
  }

  const notice =
    bodySource === "scraped"
      ? `<p><em>Conteúdo obtido a partir da reportagem original de <strong>${article.fonte}</strong>, reorganizado pelo Eventos Históricos. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a matéria original</a>.</em></p>`
      : `<p><em>Artigo elaborado pela redação editorial do Eventos Históricos com base na cobertura de <strong>${article.fonte}</strong>. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a reportagem original</a>.</em></p>`

  return {
    ...article,
    conteudo: body,
    conteudoHtml: `${textToHtmlParagraphs(body)}${notice}`,
    idioma: bodyOriginal ? "en" : article.idioma,
    noticeHtml: notice,
    conteudoOriginal: bodyOriginal ?? article.conteudoOriginal,
  }
}

// Cheap enough for generateMetadata() to await without delaying the page's
// initial response — skips the source-page scrape + full-body translation
// that getNewsArticleBySlug()'s enrichment step does.
export async function getNewsArticleMetaBySlug(slug: string): Promise<{ titulo: string; descricao: string } | null> {
  const localArticle = normalizeLocalArticles().find((article) => article.slug === slug)

  if (localArticle) {
    return { titulo: localArticle.titulo, descricao: localArticle.descricao }
  }

  const candidate = await findScoredCandidateBySlug(slug)

  if (!candidate) {
    return null
  }

  const hydrated = await hydrateScoredCandidate(candidate)
  return { titulo: hydrated.titulo, descricao: hydrated.descricao }
}

export async function getNewsArticleBySlug(slug: string) {
  // Local (static) articles never need the RSS feed sweep at all.
  const localArticle = normalizeLocalArticles().find((article) => article.slug === slug)
  if (localArticle) return localArticle

  // Fast path: fully enriched article pre-warmed by cron (30 min TTL).
  const cached = await getCachedArticleBySlug(slug)
  if (cached) return cached

  // Slug in RSS list cache but not yet enriched by cron — return the basic
  // article (feed content, possibly truncated). No scraping on user visit.
  const cachedList = await getCachedRssArticles()
  const listHit = cachedList?.find((a) => a.slug === slug)
  if (listHit) return listHit

  // Last resort: fetch feeds to find the article, return without scraping.
  const directCandidate = await findScoredCandidateBySlug(slug)
  if (directCandidate) {
    return hydrateScoredCandidate(directCandidate, true)
  }

  // Fallback for AI-generated portal analyses slugs.
  const { localArticles, rssArticles } = await getCuratedNews(30)
  return localArticles.find((a) => a.slug === slug) ?? rssArticles.find((a) => a.slug === slug)
}

export async function getRelatedNews(currentSlug: string, limit = 2) {
  const articles = await getRssNews(12)
  return articles.filter((article) => article.slug !== currentSlug).slice(0, limit)
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
