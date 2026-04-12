import noticiasData from "@/data/noticias.json"

export interface SiteNewsArticle {
  id: string
  slug: string
  titulo: string
  descricao: string
  conteudo: string
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
  tipo: "rss" | "local"
}

interface ParsedFeedItem {
  titulo: string
  descricao: string
  data: string
  fonte: string
  link: string
  imagem?: string
}

const RSS_FEEDS = [
  { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "G1", url: "https://g1.globo.com/rss/g1/mundo/" },
  { name: "Folha", url: "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml" },
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

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(value: string) {
  return value
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
    .trim()
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

function extractAttribute(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
}

function buildRssSlug(item: ParsedFeedItem) {
  const datePart = item.data ? new Date(item.data).toISOString().slice(0, 10) : "atual"
  return slugify(`${item.fonte}-${item.titulo}-${datePart}`)
}

function buildRssBody(article: ParsedFeedItem, categoria: string) {
  const base = article.descricao || article.titulo
  return [
    base,
    `Esta é uma leitura resumida, montada a partir do feed oficial de ${article.fonte}, dentro da curadoria de ${categoria} do Eventos Históricos.`,
    "Para conferir a cobertura completa e o contexto original, use o link da fonte oficial no final da página.",
  ].join("\n\n")
}

function isRelevantArticle(article: ParsedFeedItem) {
  const text = normalizeText(`${article.titulo} ${article.descricao}`)
  const hasRelevantKeyword = RELEVANT_KEYWORDS.some((keyword) => text.includes(keyword))
  const hasNegativeKeyword = NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))
  return hasRelevantKeyword && !hasNegativeKeyword
}

function inferCategory(article: ParsedFeedItem) {
  const text = normalizeText(`${article.titulo} ${article.descricao}`)
  const matchedRule = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))
  return matchedRule?.categoria ?? "Geopolítica"
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

function parseRssItems(xml: string, feedName: string) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []

  return items
    .map((item) => {
      const titulo = stripTags(extractTag(item, "title"))
      const link = stripTags(extractTag(item, "link"))
      const descricao = stripTags(extractTag(item, "description")) || stripTags(extractTag(item, "content:encoded"))
      const data = stripTags(extractTag(item, "pubDate"))
      const fonte = stripTags(extractTag(item, "source")) || feedName
      const imagem =
        extractAttribute(item, "media:content", "url") ||
        extractAttribute(item, "media:thumbnail", "url") ||
        extractAttribute(item, "enclosure", "url")

      return {
        titulo,
        descricao,
        data,
        fonte,
        link,
        imagem,
      }
    })
    .filter((item) => item.titulo && item.link)
}

async function fetchFeed(url: string, name: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 1800 },
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

export async function getRssNews(limit = 20): Promise<SiteNewsArticle[]> {
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
    .map((item) => {
      const categoria = inferCategory(item)
      const parsedDate = item.data ? new Date(item.data) : new Date()
      const data = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
      const slug = buildRssSlug(item)

      return {
        id: `rss-${slug}`,
        slug,
        titulo: item.titulo,
        descricao: item.descricao || "Resumo selecionado automaticamente a partir de feeds internacionais e brasileiros.",
        conteudo: buildRssBody(item, categoria),
        data,
        categoria,
        fonte: item.fonte,
        fonteUrl: item.link,
        linkFonte: item.link,
        imagem: item.imagem || inferImage({ ...item, categoria }),
        tags: [normalizeText(categoria), "rss", normalizeText(item.fonte)],
        href: `/noticias/${slug}`,
        externo: false,
        tipo: "rss",
      } satisfies SiteNewsArticle
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, limit)
}

function normalizeLocalArticles(): SiteNewsArticle[] {
  return [...noticiasData]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map((article) => ({
      id: article.id,
      slug: article.slug,
      titulo: article.titulo,
      descricao: article.descricao,
      conteudo: article.conteudo,
      data: article.data,
      categoria: article.categoria,
      autor: article.autor,
      fonte: article.fonte || "Eventos Históricos",
      fonteUrl: article.linkFonte,
      linkFonte: article.linkFonte,
      imagem: article.imagem || inferImage(article),
      tags: article.tags ?? [],
      href: `/noticias/${article.slug}`,
      externo: false,
      tipo: "local",
    }))
}

export async function getCuratedNews(limit = 20) {
  const rssArticles = await getRssNews(limit)
  const localArticles = normalizeLocalArticles()

  return {
    rssArticles,
    localArticles,
    combinedArticles: rssArticles.length > 0 ? [...rssArticles, ...localArticles] : localArticles,
  }
}

export async function getNewsArticleBySlug(slug: string) {
  const localArticles = normalizeLocalArticles()
  const localArticle = localArticles.find((article) => article.slug === slug)

  if (localArticle) {
    return localArticle
  }

  const rssArticles = await getRssNews(30)
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
