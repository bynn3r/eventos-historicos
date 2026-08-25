import { NextResponse } from "next/server"
import { refreshNewsCache } from "@/lib/news"
import { lastCacheError } from "@/lib/news-cache"

export const dynamic = "force-dynamic"

// Called on a schedule by EventBridge to recompute the news list (feed fetch +
// translation + image resolution) once, in the background, and store it in
// DynamoDB — so real visitors read a precomputed cache instead of triggering
// that work themselves on every request.
export async function GET() {
  try {
    const result = await refreshNewsCache()
    // TEMPORARY: lastCacheError while diagnosing why writes fail in production.
    return NextResponse.json({ ...result, lastCacheError })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown_error" }, { status: 500 })
  }
}
