function createLimiter(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []
  const runNext = () => {
    if (active >= concurrency || queue.length === 0) return
    active++
    const run = queue.shift()
    run?.()
  }
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => { active--; runNext() })
      })
      runNext()
    })
  }
}

const myMemoryLimit = createLimiter(3)
const googleLimit = createLimiter(8)

function splitIntoChunks(text: string, maxLen = 480): string[] {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let current = ""
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence
    if (next.length <= maxLen) {
      current = next
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
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: "PT-BR" }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return text
  const data = (await res.json()) as { translations?: Array<{ text: string }> }
  return data.translations?.[0]?.text || text
}

async function translateChunkWithGoogle(chunk: string): Promise<string | null> {
  return googleLimit(async () => {
    try {
      const url = new URL("https://translate.googleapis.com/translate_a/single")
      url.searchParams.set("client", "gtx")
      url.searchParams.set("sl", "en")
      url.searchParams.set("tl", "pt")
      url.searchParams.set("dt", "t")
      url.searchParams.set("q", chunk)
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(3500),
        headers: { "User-Agent": "Mozilla/5.0" },
      })
      if (!res.ok) return null
      const data = (await res.json()) as unknown
      const segments = Array.isArray(data) ? data[0] : null
      if (!Array.isArray(segments) || segments.length === 0) return null
      return segments.map((s: unknown) => (Array.isArray(s) ? s[0] ?? "" : "")).join("").trim() || null
    } catch {
      return null
    }
  })
}

async function translateWithGoogle(text: string): Promise<string | null> {
  const paragraphs = text.split(/\n\s*\n/)
  const results: string[] = []
  for (const paragraph of paragraphs) {
    const chunks = paragraph.length <= 4500 ? [paragraph] : splitIntoChunks(paragraph, 4500)
    const translated: string[] = []
    for (const chunk of chunks) {
      const result = await translateChunkWithGoogle(chunk)
      if (!result) return null
      translated.push(result)
    }
    results.push(translated.join(" "))
  }
  return results.join("\n\n")
}

async function translateChunkWithMyMemory(chunk: string): Promise<string> {
  return myMemoryLimit(async () => {
    try {
      const email = process.env.MYMEMORY_EMAIL ?? ""
      const url = new URL("https://api.mymemory.translated.net/get")
      url.searchParams.set("q", chunk)
      url.searchParams.set("langpair", "en|pt-BR")
      if (email) url.searchParams.set("de", email)
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(3500) })
      if (!res.ok) return chunk
      const data = (await res.json()) as { responseStatus: number; responseData?: { translatedText?: string } }
      if (data.responseStatus !== 200) return chunk
      return data.responseData?.translatedText || chunk
    } catch {
      return chunk
    }
  })
}

async function translateWithMyMemory(text: string): Promise<string> {
  const paragraphs = text.split(/\n\s*\n/)
  if (paragraphs.length === 1) {
    const chunks = splitIntoChunks(paragraphs[0])
    if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0])
    const results = await Promise.allSettled(chunks.map(translateChunkWithMyMemory))
    return results.map((r, i) => (r.status === "fulfilled" ? r.value : chunks[i])).join(" ")
  }
  const translatedParagraphs = await Promise.all(paragraphs.map(async (paragraph) => {
    const chunks = splitIntoChunks(paragraph)
    if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0])
    const results = await Promise.allSettled(chunks.map(translateChunkWithMyMemory))
    return results.map((r, i) => (r.status === "fulfilled" ? r.value : chunks[i])).join(" ")
  }))
  return translatedParagraphs.join("\n\n")
}

const translationCache = new Map<string, Promise<string>>()

export async function translateToPortuguese(text: string): Promise<string> {
  if (!text.trim()) return text
  const cacheKey = text.slice(0, 250)
  const cached = translationCache.get(cacheKey)
  if (cached !== undefined) return cached

  const pending = (async (): Promise<string> => {
    try {
      const deeplKey = process.env.DEEPL_API_KEY
      if (deeplKey) return await translateWithDeepL(text, deeplKey)
      const googleResult = await translateWithGoogle(text)
      if (googleResult) return googleResult
      return await translateWithMyMemory(text)
    } catch {
      return text
    }
  })()

  translationCache.set(cacheKey, pending)
  return pending
}
