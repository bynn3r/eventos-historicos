import noticiasData from "@/data/noticias.json"

export interface SiteNewsArticle {
  id: string
  titulo: string
  descricao: string
  conteudo: string
  data: string
  categoria: string
  autor?: string
  fonte: string
  linkFonte?: string
  imagem: string
  tags: string[]
  href: string
  externo: boolean
  tipo: "rss" | "local"
}

const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=geopolitica%20OR%20diplomacia%20OR%20%22relacoes%20internacionais%22%20OR%20guerra&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  "https://news.google.com/rss/search?q=%22evento%20historico%22%20OR%20%22marco%20historico%22%20OR%20arqueologia%20OR%20%22patrimonio%20historico%22&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  "https://news.google.com/rss/search?q=lua%20OR%20artemis%20OR%20nasa%20OR%20%22corrida%20espacial%22%20OR%20%22exploracao%20espacial%22&hl=pt-BR&gl=BR&ceid=BR:pt-419",
]

const POSITIVE_KEYWORDS = [
  "geopolit",
  "diplomac",
  "guerra",
  "conflito",
  "otan",
  "onu",
  "defesa",
  "seguranca internacional",
  "relacoes internacionais",
  "sancoes",
  "fronteira",
  "territorio",
  "historic",
  "arqueolog",
  "imperio",
  "patrimonio",
  "museu",
  "descoberta",
  "lua",
  "artemis",
  "nasa",
  "apollo",
  "espacial",
  "corrida espacial",
  "exploracao espacial",
]

const NEGATIVE_KEYWORDS = ["futebol", "bbb", "novela", "celebridade", "horoscopo", "loteria", "fofoca"]

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function isRelevantArticle(article: { titulo: string; descricao: string }) {
  const text = normalizeText(`${article.titulo} ${article.descricao}`)
  const hasPositiveKeyword = POSITIVE_KEYWORDS.some((keyword) => text.includes(keyword))
  const hasNegativeKeyword = NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))
  return hasPositiveKeyword && !hasNegativeKeyword
}

function inferCategory(text: string) {
  const normalized = normalizeText(text)

  if (/(lua|artemis|apollo|nasa|espacial)/.test(normalized)) {
    return "Espaço e História"
  }
  if (/(arqueolog|patrimonio|museu|descoberta|historic)/.test(normalized)) {
    return "Memória Histórica"
  }
  if (/(oriente medio|israel|gaza|ira|sir)/.test(normalized)) {
    return "Oriente Médio"
  }
  if (/(otan|guerra|defesa|fronteira|territorio)/.test(normalized)) {
    return "Defesa e Segurança"
  }

  return "Geopolítica"
}

function inferImage(article: { titulo: string; descricao: string; categoria: string }) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`)
  if (/(historic|arqueolog|museu|patrimonio|lua|apollo|artemis|espacial)/.test(text)) {
    return "/historical-books-and-world-map-study.jpg"
  }
  if (/(oriente medio|guerra|defesa|fronteira|territorio)/.test(text)) {
    return "/world-map-with-geopolitical-tensions.jpg"
  }
  return "/geopolitics-world-map-with-news-overlay.jpg"
}

function parseRssItems(xml: string) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []

  return items
    .map((item) => {
      const titulo = stripTags(extractTag(item, "title"))
      const link = stripTags(extractTag(item, "link"))
      const descricao = stripTags(extractTag(item, "description"))
      const data = stripTags(extractTag(item, "pubDate"))
      const fonte = stripTags(extractTag(item, "source")) || "Google News"

      return {
        titulo,
        descricao,
        data,
        fonte,
        link,
      }
    })
    .filter((item) => item.titulo && item.link)
}

async function fetchFeed(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 1800 },
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!response.ok) {
      return []
    }

    const xml = await response.text()
    return parseRssItems(xml)
  } catch {
    return []
  }
}

function normalizeLocalArticles(): SiteNewsArticle[] {
  return [...noticiasData]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map((article) => ({
      id: article.id,
      titulo: article.titulo,
      descricao: article.descricao,
      conteudo: article.conteudo,
      data: article.data,
      categoria: article.categoria,
      autor: article.autor,
      fonte: article.fonte || "Eventos Históricos",
      linkFonte: article.linkFonte,
      imagem: article.imagem || inferImage(article),
      tags: article.tags ?? [],
      href: `/noticias/${article.slug}`,
      externo: false,
      tipo: "local" as const,
    }))
}

function normalizeRssArticles(items: Awaited<ReturnType<typeof fetchFeed>>): SiteNewsArticle[] {
  const seen = new Set<string>()

  return items
    .filter((item) => isRelevantArticle(item))
    .filter((item) => {
      const key = normalizeText(item.titulo)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .map((item, index) => {
      const categoria = inferCategory(`${item.titulo} ${item.descricao}`)
      const parsedDate = item.data ? new Date(item.data) : new Date()
      const isoDate = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()

      return {
        id: `rss-${slugify(item.titulo)}-${index}`,
        titulo: item.titulo,
        descricao: item.descricao || "Cobertura selecionada de temas internacionais, memória histórica e marcos contemporâneos.",
        conteudo: item.descricao || item.titulo,
        data: isoDate,
        categoria,
        fonte: item.fonte || "Google News",
        linkFonte: item.link,
        imagem: inferImage({ ...item, categoria }),
        tags: [categoria.toLowerCase(), "rss", "atualidades"],
        href: item.link,
        externo: true,
        tipo: "rss" as const,
      }
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
}

export async function getCuratedNews(limit = 8) {
  const results = await Promise.all(RSS_FEEDS.map((feed) => fetchFeed(feed)))
  const rssArticles = normalizeRssArticles(results.flat()).slice(0, limit)
  const localArticles = normalizeLocalArticles()

  return {
    rssArticles,
    localArticles,
    combinedArticles: rssArticles.length > 0 ? [...rssArticles, ...localArticles] : localArticles,
  }
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
