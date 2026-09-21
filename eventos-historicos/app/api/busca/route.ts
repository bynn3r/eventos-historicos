import { type NextRequest, NextResponse } from "next/server"
import { getAllTimelineEvents } from "@/lib/timeline"
import { getAllCharacters } from "@/lib/characters"
import { listNoticiasDb } from "@/lib/dynamodb"
import curiosidadesData from "@/data/curiosidades.json"

export const dynamic = "force-dynamic"

export interface SearchResultItem {
  id: string
  type: "evento" | "curiosidade" | "personagem" | "noticia"
  title: string
  excerpt: string
  category: string
  date: string
  url: string
  image?: string
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function scoreMatch(haystack: string, terms: string[], titleHaystack: string): number {
  let score = 0
  for (const term of terms) {
    if (titleHaystack.includes(term)) score += 3
    else if (haystack.includes(term)) score += 1
  }
  return score
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const rawQuery = searchParams.get("q")?.trim() ?? ""
  const type = searchParams.get("type") ?? "all"
  const category = searchParams.get("category") ?? "all"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 60)

  if (rawQuery.length < 2) {
    return NextResponse.json({ results: [], categories: [] })
  }

  const terms = normalize(rawQuery).split(/\s+/).filter(Boolean)
  const results: (SearchResultItem & { score: number })[] = []
  const allCategories = new Set<string>()

  if (type === "all" || type === "evento") {
    for (const event of getAllTimelineEvents()) {
      allCategories.add(event.category)
      if (category !== "all" && event.category !== category) continue

      const titleHaystack = normalize(event.title)
      const haystack = normalize(`${event.title} ${event.summary} ${event.keywords.join(" ")}`)
      const score = scoreMatch(haystack, terms, titleHaystack)
      if (score === 0) continue

      results.push({
        id: `evento-${event.slug}`,
        type: "evento",
        title: event.title,
        excerpt: event.summary,
        category: event.category,
        date: event.dateDisplay,
        url: `/linha-do-tempo/${event.slug}`,
        image: event.image,
        score: score + (event.importance >= 4 ? event.importance - 3 : 0),
      })
    }
  }

  if (type === "all" || type === "curiosidade") {
    for (const c of curiosidadesData as {
      id: string
      titulo: string
      slug: string
      descricao: string
      categoria: string
      data: string
      imagem: string
      keywords: string[]
    }[]) {
      allCategories.add(c.categoria)
      if (category !== "all" && c.categoria !== category) continue

      const titleHaystack = normalize(c.titulo)
      const haystack = normalize(`${c.titulo} ${c.descricao} ${c.keywords.join(" ")}`)
      const score = scoreMatch(haystack, terms, titleHaystack)
      if (score === 0) continue

      results.push({
        id: `curiosidade-${c.slug}`,
        type: "curiosidade",
        title: c.titulo,
        excerpt: c.descricao,
        category: c.categoria,
        date: c.data,
        url: `/curiosidades/${c.slug}`,
        image: c.imagem,
        score,
      })
    }
  }

  if (type === "all" || type === "personagem") {
    for (const char of getAllCharacters()) {
      if (category !== "all") continue // personagens não têm categoria própria

      const titleHaystack = normalize(char.name)
      const haystack = normalize(`${char.name} ${char.role} ${char.description}`)
      const score = scoreMatch(haystack, terms, titleHaystack)
      if (score === 0) continue

      results.push({
        id: `personagem-${char.slug}`,
        type: "personagem",
        title: char.name,
        excerpt: char.description || char.role,
        category: char.role,
        date: "",
        url: `/personagens/${char.slug}`,
        image: char.image || undefined,
        score,
      })
    }
  }

  if (type === "all" || type === "noticia") {
    const noticias = await listNoticiasDb(60)
    for (const n of noticias) {
      allCategories.add(n.categoria)
      if (category !== "all" && n.categoria !== category) continue

      const titleHaystack = normalize(n.titulo)
      const haystack = normalize(`${n.titulo} ${n.descricao} ${n.tags.join(" ")}`)
      const score = scoreMatch(haystack, terms, titleHaystack)
      if (score === 0) continue

      results.push({
        id: `noticia-${n.slug}`,
        type: "noticia",
        title: n.titulo,
        excerpt: n.descricao,
        category: n.categoria,
        date: n.data,
        url: `/noticias/${n.slug}`,
        image: n.imagem || undefined,
        score,
      })
    }
  }

  const sorted = results.sort((a, b) => b.score - a.score).slice(0, limit)

  return NextResponse.json({
    results: sorted.map(({ score, ...rest }) => rest),
    categories: Array.from(allCategories).sort(),
  })
}
