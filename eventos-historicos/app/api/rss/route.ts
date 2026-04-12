import { NextResponse } from "next/server"
import { getRssNews } from "@/lib/news"

export const runtime = "edge"
export const revalidate = 1800

export async function GET() {
  const articles = await getRssNews(20)
  return NextResponse.json(articles)
}
