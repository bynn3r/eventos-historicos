import { NextResponse } from "next/server"
import { getCuratedNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET() {
  const curated = await getCuratedNews(20)

  return NextResponse.json({
    rssArticles: curated.rssArticles,
    localArticles: curated.localArticles,
    combinedArticles: curated.combinedArticles,
  })
}
