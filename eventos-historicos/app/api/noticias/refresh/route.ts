import { type NextRequest, NextResponse } from "next/server"
import { refreshRssCache } from "@/lib/news"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  const querySecret = request.nextUrl.searchParams.get("secret")

  const authorized =
    !secret ||
    auth === `Bearer ${secret}` ||
    querySecret === secret

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const articles = await refreshRssCache()
  return NextResponse.json({ ok: true, refreshed: articles.length, at: new Date().toISOString() })
}
