const translationCache = new Map<string, Promise<string>>()

function splitIntoChunks(text: string, maxLen = 480): string[] {
  if (text.length <= maxLen) return [text]

  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let current = ""

  for (const sentence of sentences) {
    if ((current ? current + " " + sentence : sentence).length <= maxLen) {
      current = current ? current + " " + sentence : sentence
    } else {
      if (current) chunks.push(current)
      current = sentence.length > maxLen ? sentence.slice(0, maxLen) : sentence
    }
  }
  if (current) chunks.push(current)
  return chunks
}

async function translateWithDeepL(text: string, apiKey: string): Promise<string> {
  const apiUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate"

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: "PT-BR" }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return text
  const data = (await res.json()) as { translations?: Array<{ text: string }> }
  return data.translations?.[0]?.text || text
}

async function translateChunkWithMyMemory(chunk: string): Promise<string> {
  const email = process.env.MYMEMORY_EMAIL ?? ""
  const url = new URL("https://api.mymemory.translated.net/get")
  url.searchParams.set("q", chunk)
  url.searchParams.set("langpair", "en|pt-BR")
  if (email) url.searchParams.set("de", email)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return chunk

  const data = (await res.json()) as {
    responseStatus: number
    responseData?: { translatedText?: string }
  }

  if (data.responseStatus !== 200) return chunk
  return data.responseData?.translatedText || chunk
}

async function translateWithMyMemory(text: string): Promise<string> {
  const chunks = splitIntoChunks(text)
  if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0])

  const translated = await Promise.all(chunks.map(translateChunkWithMyMemory))
  return translated.join(" ")
}

export async function translateToPortuguese(text: string): Promise<string> {
  if (!text.trim()) return text

  const cacheKey = text.slice(0, 250)
  const cached = translationCache.get(cacheKey)
  if (cached !== undefined) return cached

  const pending = (async (): Promise<string> => {
    try {
      const deeplKey = process.env.DEEPL_API_KEY
      if (deeplKey) return await translateWithDeepL(text, deeplKey)
      return await translateWithMyMemory(text)
    } catch {
      return text
    }
  })()

  translationCache.set(cacheKey, pending)
  return pending
}
