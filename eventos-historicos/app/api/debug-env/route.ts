import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    openAIKeyLength: process.env.OPENAI_API_KEY?.length ?? 0,
    openAIModel: process.env.OPENAI_EDITORIAL_MODEL ?? null,
    hasMymemoryEmail: Boolean(process.env.MYMEMORY_EMAIL),
  })
}
