import { NextResponse } from "next/server"
import { translateToPortuguese } from "@/lib/deepl"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const texts = (body as { texts?: unknown })?.texts

  if (!Array.isArray(texts) || texts.length === 0 || texts.some((text) => typeof text !== "string")) {
    return NextResponse.json({ error: "invalid_texts" }, { status: 400 })
  }

  if (texts.length > 40) {
    return NextResponse.json({ error: "too_many_texts" }, { status: 400 })
  }

  const translated = await Promise.all((texts as string[]).map((text) => translateToPortuguese(text)))

  return NextResponse.json({ texts: translated })
}
