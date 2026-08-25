const translationCache = new Map<string, Promise<string>>()

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
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--
            runNext()
          })
      })
      runNext()
    })
  }
}

const myMemoryLimit = createLimiter(3)
const googleLimit = createLimiter(4)

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

      const translated = segments.map((segment: unknown) => (Array.isArray(segment) ? segment[0] ?? "" : "")).join("")
      return translated.trim() || null
    } catch {
      return null
    }
  })
}

async function translateParagraphWithGoogle(paragraph: string): Promise<string | null> {
  const chunks = paragraph.length <= 4500 ? [paragraph] : splitIntoChunks(paragraph, 4500)
  const results: string[] = []

  for (const chunk of chunks) {
    const translated = await translateChunkWithGoogle(chunk)
    if (!translated) return null
    results.push(translated)
  }

  return results.join(" ")
}

async function translateWithGoogle(text: string): Promise<string | null> {
  // Chunking by sentence (splitIntoChunks) doesn't know about paragraph breaks —
  // translate paragraph-by-paragraph and rejoin with blank lines so multi-
  // paragraph articles don't collapse into one wall of text.
  const paragraphs = text.split(/\n\s*\n/)
  const translatedParagraphs: string[] = []

  for (const paragraph of paragraphs) {
    const translated = await translateParagraphWithGoogle(paragraph)
    if (translated === null) return null
    translatedParagraphs.push(translated)
  }

  return translatedParagraphs.join("\n\n")
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

      const data = (await res.json()) as {
        responseStatus: number
        responseData?: { translatedText?: string }
      }

      if (data.responseStatus !== 200) return chunk
      return data.responseData?.translatedText || chunk
    } catch {
      return chunk
    }
  })
}

async function translateParagraphWithMyMemory(paragraph: string): Promise<string> {
  const chunks = splitIntoChunks(paragraph)
  if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0])

  // Promise.all would let a single failed chunk reject the whole batch and
  // discard every chunk that DID translate successfully. allSettled keeps
  // whatever succeeded and only falls back per-chunk.
  const results = await Promise.allSettled(chunks.map(translateChunkWithMyMemory))
  const translated = results.map((result, index) => (result.status === "fulfilled" ? result.value : chunks[index]))
  return translated.join(" ")
}

async function translateWithMyMemory(text: string): Promise<string> {
  // Same paragraph-preserving approach as translateWithGoogle — chunking by
  // sentence alone loses the \n\n paragraph breaks.
  const paragraphs = text.split(/\n\s*\n/)

  if (paragraphs.length === 1) {
    return translateParagraphWithMyMemory(paragraphs[0])
  }

  const translatedParagraphs = await Promise.all(paragraphs.map(translateParagraphWithMyMemory))
  return translatedParagraphs.join("\n\n")
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
