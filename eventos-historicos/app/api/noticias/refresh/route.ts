import { type NextRequest, NextResponse } from "next/server"
import { refreshRssCache } from "@/lib/news"

export const dynamic = "force-dynamic"

function checkAuth(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = request.headers.get("authorization")
  const querySecret = request.nextUrl.searchParams.get("secret")
  return auth === `Bearer ${secret}` || querySecret === secret
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const articles = await refreshRssCache()
  return NextResponse.json({ ok: true, refreshed: articles.length, at: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const articles = await refreshRssCache()
  return NextResponse.json({ ok: true, refreshed: articles.length, at: new Date().toISOString() })
}
