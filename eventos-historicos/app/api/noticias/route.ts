import { NextResponse } from "next/server"
import { getCuratedNews } from "@/lib/news"

export const revalidate = 1800

export async function GET() {
  const news = await getCuratedNews(8)
  return NextResponse.json(news)
}
