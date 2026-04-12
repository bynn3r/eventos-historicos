import { NextResponse } from "next/server"
import { getCuratedNews, getRssNews } from "@/lib/news"

export const revalidate = 1800

export async function GET() {
  const [rssArticles, curated] = await Promise.all([getRssNews(20), getCuratedNews(20)])

  return NextResponse.json({
    rssArticles,
    localArticles: curated.localArticles,
    combinedArticles: rssArticles.length > 0 ? [...rssArticles, ...curated.localArticles] : curated.localArticles,
  })
}
