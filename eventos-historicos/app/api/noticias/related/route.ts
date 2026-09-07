import { type NextRequest, NextResponse } from "next/server"
import { listNoticiasDb } from "@/lib/dynamodb"

export const dynamic = "force-dynamic"

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const raw = searchParams.get("keywords") ?? ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "2", 10), 4)

  const keywords = raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 3) // ignore very short words
  if (keywords.length === 0) {
    return NextResponse.json([], { headers: { "Cache-Control": "public, s-maxage=300" } })
  }

  const articles = await listNoticiasDb(30)
  const normalizedKws = keywords.map(normalize)

  const scored = articles
    .map((article) => {
      const haystack = normalize(
        `${article.titulo} ${article.descricao} ${article.tags.join(" ")}`
      )
      let score = 0
      for (const kw of normalizedKws) {
        if (haystack.includes(kw)) score += 1
      }
      return { article, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => ({
      slug: article.slug,
      titulo: article.titulo,
      descricao: article.descricao,
      data: article.data,
      categoria: article.categoria,
      href: `/noticias/${article.slug}`,
    }))

  return NextResponse.json(scored, {
    headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60" },
  })
}
