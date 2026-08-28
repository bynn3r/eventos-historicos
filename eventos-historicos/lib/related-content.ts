import { getAllTimelineEvents } from "@/lib/timeline"
import curiosidadesData from "@/data/curiosidades.json"

export interface RelatedContentItem {
  type: "evento" | "curiosidade"
  slug: string
  title: string
  summary: string
  image: string
  href: string
  category: string
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

interface Matchable {
  keywords: string[]
  category: string
  item: RelatedContentItem
}

function buildPool(): Matchable[] {
  const timelinePool: Matchable[] = getAllTimelineEvents().map((event) => ({
    keywords: event.keywords,
    category: event.category,
    item: {
      type: "evento",
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      image: event.image,
      href: `/linha-do-tempo/${event.slug}`,
      category: event.category,
    },
  }))

  const curiosidadesPool: Matchable[] = (curiosidadesData as Array<{
    slug: string
    titulo: string
    descricao: string
    imagem: string
    categoria: string
    keywords?: string[]
  }>).map((curiosidade) => ({
    keywords: curiosidade.keywords ?? [],
    category: curiosidade.categoria,
    item: {
      type: "curiosidade",
      slug: curiosidade.slug,
      title: curiosidade.titulo,
      summary: curiosidade.descricao,
      image: curiosidade.imagem,
      href: `/curiosidades/${curiosidade.slug}`,
      category: curiosidade.categoria,
    },
  }))

  return [...timelinePool, ...curiosidadesPool]
}

/**
 * Simple keyword-overlap scoring — matches live, ever-changing news content
 * against the static historical catalog without needing per-article manual
 * links (infeasible, since news content rotates multiple times a day) or a
 * per-request AI call (costly at this volume). Not "smart", just literal
 * keyword hits — a query with no historical parallel returns nothing, which
 * is the correct behavior (no forced/irrelevant suggestion).
 */
interface FindRelatedContentOptions {
  category?: string
  limit?: number
  /** Exclude the item currently being viewed from its own "related" list. */
  excludeSlug?: string
  /** Restrict results to one content type (e.g. only curiosidades from a timeline article). */
  onlyType?: RelatedContentItem["type"]
}

export function findRelatedContent(query: string, options: FindRelatedContentOptions = {}): RelatedContentItem[] {
  const { category, limit = 3, excludeSlug, onlyType } = options
  const normalizedQuery = normalize(query)
  const pool = buildPool()

  const scored = pool
    .filter(({ item }) => item.slug !== excludeSlug)
    .filter(({ item }) => !onlyType || item.type === onlyType)
    .map(({ keywords, category: itemCategory, item }) => {
      let score = 0
      for (const keyword of keywords) {
        if (normalizedQuery.includes(normalize(keyword))) {
          score += 2
        }
      }
      if (category && normalize(itemCategory) === normalize(category)) {
        score += 1
      }
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(({ item }) => item)
}
