import { NextResponse } from "next/server"
import { getCuratedNews } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function GET() {
  // getCuratedNews has a 90s in-memory cache — if articles were just fetched,
  // this call reuses the cached rssArticles and only pays for analyses.
  const curated = await getCuratedNews(20)
  return NextResponse.json({ localArticles: curated.localArticles })
}
