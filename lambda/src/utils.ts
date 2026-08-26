export function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function normalizeEncoding(value: string) {
  return value
    .replace(/�/g, "")
    .replace(/Ã¡/g, "á").replace(/Ã¢/g, "â").replace(/Ã£/g, "ã")
    .replace(/Ãª/g, "ê").replace(/Ã©/g, "é").replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó").replace(/Ãµ/g, "õ").replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç").replace(/Ã"/g, "Ó").replace(/Ã/g, "à")
}

export function normalizeText(value: string) {
  return normalizeEncoding(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function decodeEntities(value: string) {
  return normalizeEncoding(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ").trim(),
  )
}

export function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
}

export function looksMostlyEnglish(value: string) {
  const normalized = ` ${normalizeText(value)} `
  return /\b(the|a|an|is|are|was|were|be|been|of|in|on|to|for|and|but|or|with|by|at|from|as|it|its|this|that|he|she|they|we|you|who|which|has|have|had|will|would|can|could|should|may|might|must|not|no|up|out|if|so|than|then|after|before|over|under|about|into|through|says|said|warns|calls|reports|amid|despite|against|during|while|when|where|how|new|more|last|first|their|our|his|her|us|uk)\b/.test(normalized)
}

export function clipText(text: string, maxLength: number) {
  const normalized = normalizeEncoding(text).replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export function sanitizeHtml(html: string) {
  return normalizeEncoding(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<picture[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<source[^>]*>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<a[^>]*>\s*(leia mais|read more|continue reading)[\s\S]*?<\/a>/gi, "")
    .replace(/<p>\s*(leia mais|read more|continue reading)[\s\S]*?<\/p>/gi, "")
    .trim()
}

export function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

export function extractAttribute(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

export function extractMetaContent(html: string, propertyName: string) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, "i"))
  return match ? decodeEntities(match[1]) : ""
}

const JUNK_PARAGRAPH_PATTERN =
  /(cookie|assine|inscreva-se|newsletter|publicidade|advertisement|compartilhe esta|leia tamb[ée]m|veja tamb[ée]m|siga o |siga a |clique aqui|todos os direitos reservados|copyright ©|sign up|subscribe|related:|read more:|leia mais:|^listen\b|save share|share-nodes|whatsapp-stroke|copylink|caret-right|add .+ on google|download our app|follow us|^by [a-z .]+$|min read|mins read|\bfacebook\b.*\bx\b.*\bwhatsapp\b|recommended stories|^list \d+ of \d+|end of list)/i

const SENTENCE_END_PATTERN = /[.!?"'")]\s*$/

export function cleanFeedText(text: string) {
  return normalizeEncoding(text)
    .replace(/�/g, "")
    .replace(/(?:veja os v[íi]deos[^.]*\.)/gi, "")
    .replace(/(?:mande para o g1[^.]*\.)/gi, "")
    .replace(/(?:tem alguma sugest[aã]o de reportagem[^.]*\.)/gi, "")
    .replace(/(?:clique aqui para seguir[^.]*\.)/gi, "")
    .replace(/(?:leia mais no site original\.?)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function paragraphizeText(text: string) {
  const normalized = cleanFeedText(text)
  if (!normalized) return []

  const rawBlocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const paragraphs: string[] = []

  for (const block of rawBlocks) {
    if (block.length <= 360) {
      paragraphs.push(block)
      continue
    }

    const sentences = block
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9"])/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (sentences.length <= 1) {
      paragraphs.push(block)
      continue
    }

    let current = ""
    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence
      if (next.length > 420 && current) {
        paragraphs.push(current)
        current = sentence
      } else {
        current = next
      }
    }
    if (current) paragraphs.push(current)
  }

  return paragraphs
}

export function extractParagraphText(html: string) {
  const clean = sanitizeHtml(html)
  if (!clean) return ""

  const text = clean
    .replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, " ")

  return paragraphizeText(text).join("\n\n")
}

export function textToHtmlParagraphs(text: string) {
  return paragraphizeText(text)
    .map((p) => `<p>${p}</p>`)
    .join("")
}

export function fetchSourceArticleText(url?: string) {
  return _fetchSourceArticleText(url)
}

async function _fetchSourceArticleText(url?: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return ""
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) return ""

    const html = await response.text()
    const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
    const mainHtml = sanitizeHtml(articleMatch ? articleMatch[1] : html)

    const paragraphs = extractParagraphText(mainHtml)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/last modified on[\s\S]*?\b(am|pm|edt|gmt|bst|utc)\b\.?/gi, "")
        .replace(/\blist \d+ of \d+\b/gi, "")
        .replace(/recommended stories[\s\S]*?end of list/gi, "")
        .replace(/\s{2,}/g, " ").trim())
      .filter(Boolean)
      .filter((p) => !JUNK_PARAGRAPH_PATTERN.test(p))
      .filter((p) => {
        const words = p.split(/\s+/).filter(Boolean).length
        if (words < 6) return false
        if (p.length < 200 && !SENTENCE_END_PATTERN.test(p)) return false
        return true
      })

    const selected: string[] = []
    let total = 0
    for (const p of paragraphs) {
      if (total >= 2200) break
      selected.push(p)
      total += p.length
    }

    const text = selected.join("\n\n")
    return text.length >= 400 ? text : ""
  } catch {
    return ""
  }
}
