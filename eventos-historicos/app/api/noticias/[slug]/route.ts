import { NextResponse } from "next/server"
import { getNewsArticleBySlug, getRelatedNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const [noticia, relatedNews] = await Promise.all([
    getNewsArticleBySlug(params.slug),
    getRelatedNews(params.slug, 2),
  ])

  if (!noticia) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ noticia, relatedNews })
}
