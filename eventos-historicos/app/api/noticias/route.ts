import { type NextRequest, NextResponse } from "next/server"
import { getCuratedNews, getRssNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const articlesOnly = request.nextUrl.searchParams.has("articles")

  const CDN_CACHE = "public, s-maxage=300, stale-while-revalidate=60"

  if (articlesOnly) {
    const rssArticles = await getRssNews(20)
    return NextResponse.json(
      { rssArticles, localArticles: [], combinedArticles: rssArticles },
      { headers: { "Cache-Control": CDN_CACHE } },
    )
  }

  const curated = await getCuratedNews(20)
  return NextResponse.json(
    {
      rssArticles: curated.rssArticles,
      localArticles: curated.localArticles,
      combinedArticles: curated.combinedArticles,
    },
    { headers: { "Cache-Control": CDN_CACHE } },
  )
}
