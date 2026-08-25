import { NextResponse } from "next/server"
import { getNewsArticleBySlug, getRelatedNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const noticia = await getNewsArticleBySlug(params.slug)

  if (!noticia) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const relatedNews = await getRelatedNews(params.slug, 2)

  return NextResponse.json({ noticia, relatedNews })
}
