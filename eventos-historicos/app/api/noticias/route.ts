import { type NextRequest, NextResponse } from "next/server"
import { getCuratedNews, getRssNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const articlesOnly = request.nextUrl.searchParams.has("articles")

  if (articlesOnly) {
    // Fast path: return RSS articles immediately (no OpenAI editorial calls)
    const rssArticles = await getRssNews(20)
    return NextResponse.json({ rssArticles, localArticles: [], combinedArticles: rssArticles })
  }

  const curated = await getCuratedNews(20)
  return NextResponse.json({
    rssArticles: curated.rssArticles,
    localArticles: curated.localArticles,
    combinedArticles: curated.combinedArticles,
  })
}
