const translationCache = new Map<string, Promise<string>>()

export async function translateToPortuguese(text: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey || !text.trim()) return text

  const cacheKey = text.slice(0, 250)
  const cached = translationCache.get(cacheKey)
  if (cached !== undefined) return cached

  const apiUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate"

  const pending = (async (): Promise<string> => {
    try {
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
    } catch {
      return text
    }
  })()

  translationCache.set(cacheKey, pending)
  return pending
}
