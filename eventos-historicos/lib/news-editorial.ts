import type { SiteNewsArticle } from "@/lib/news"

interface RelatedEditorialArticle {
  title: string
  summary: string
  source: string
  category: string
}

export interface ExpandedContentResult {
  titlePt: string
  subtitlePt: string
  contentPt: string
  historicalContextPt?: string
  editorialNotePt: string
  confidenceScore: number
  warnings: string[]
  originalSummary: string
  usedAI: boolean
  isFallback: boolean
}

interface EditorialGenerationInput {
  title: string
  summary: string
  source: string
  pubDate: string
  category: string
  tags: string[]
  relatedArticles?: RelatedEditorialArticle[]
}

interface OpenAIEditorialResponse {
  titlePt: string
  subtitlePt: string
  contentPt: string
  historicalContextPt: string | null
  editorialNotePt: string
  confidenceScore: number
  warnings: string[]
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_EDITORIAL_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-5-mini"
const DEFAULT_EDITORIAL_NOTE = "Conteudo adaptado editorialmente com base na fonte original."
const LOW_CONFIDENCE_THRESHOLD = 68

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function splitIntoParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)
}

function formatPtDate(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate)
}

function extractNumbers(value: string) {
  return value.match(/\b\d[\d.,:%/-]*\b/g) ?? []
}

function extractQuotedText(value: string) {
  return value.match(/["“][^"”]+["”]/g) ?? []
}

function buildAllowedText(input: EditorialGenerationInput) {
  return [
    input.title,
    input.summary,
    input.source,
    input.pubDate,
    formatPtDate(input.pubDate),
    input.category,
    ...input.tags,
    ...(input.relatedArticles ?? []).flatMap((article) => [article.title, article.summary, article.source, article.category]),
  ]
    .filter(Boolean)
    .join(" ")
}

function sanitizeGeneratedResult(result: OpenAIEditorialResponse, input: EditorialGenerationInput) {
  const allowedText = buildAllowedText(input)
  const allowedNumbers = new Set(extractNumbers(allowedText))
  const allowedQuotes = new Set(extractQuotedText(allowedText))
  const outputText = [result.titlePt, result.subtitlePt, result.contentPt, result.historicalContextPt ?? ""].join("\n")

  const unexpectedNumbers = extractNumbers(outputText).filter((value) => !allowedNumbers.has(value))
  const unexpectedQuotes = extractQuotedText(outputText).filter((value) => !allowedQuotes.has(value))

  return {
    hasUnsafeContent: unexpectedNumbers.length > 0 || unexpectedQuotes.length > 0,
    warnings: [
      ...(unexpectedNumbers.length > 0 ? ["Numeros adicionais nao confirmados pelo material-base."] : []),
      ...(unexpectedQuotes.length > 0 ? ["Citacoes nao presentes nas entradas originais."] : []),
    ],
  }
}

function estimateFallbackConfidence(input: EditorialGenerationInput) {
  const summaryLength = normalizeWhitespace(input.summary).length

  if (summaryLength >= 360) {
    return 70
  }

  if (summaryLength >= 220) {
    return 62
  }

  return 52
}

function summarizeLead(summary: string, title: string) {
  const normalizedSummary = normalizeWhitespace(summary)
  if (!normalizedSummary) {
    return normalizeWhitespace(title)
  }

  return normalizedSummary
}

function buildFallbackContent(input: EditorialGenerationInput) {
  const lead = summarizeLead(input.summary, input.title)
  const dateLabel = formatPtDate(input.pubDate)
  const paragraphs = [lead]

  if (dateLabel) {
    paragraphs.push(`A publicacao original foi veiculada em ${dateLabel} por ${input.source}, dentro da editoria de ${input.category.toLowerCase()}.`)
  }

  return paragraphs.join("\n\n")
}

function normalizeParagraphCount(value: string, maxParagraphs = 6) {
  const paragraphs = splitIntoParagraphs(value)

  if (paragraphs.length === 0) {
    return ""
  }

  return paragraphs.slice(0, maxParagraphs).join("\n\n")
}

function keepShortWhenLowConfidence(value: string, confidenceScore: number) {
  if (confidenceScore >= LOW_CONFIDENCE_THRESHOLD) {
    return value
  }

  const paragraphs = splitIntoParagraphs(value)
  return paragraphs.slice(0, Math.min(3, paragraphs.length)).join("\n\n")
}

function buildFallbackExpandedContent(input: EditorialGenerationInput): ExpandedContentResult {
  const originalSummary = normalizeWhitespace(input.summary || input.title)
  const fallbackContent = buildFallbackContent(input)

  return {
    titlePt: normalizeWhitespace(input.title),
    subtitlePt: originalSummary,
    contentPt: fallbackContent,
    historicalContextPt: undefined,
    editorialNotePt: DEFAULT_EDITORIAL_NOTE,
    confidenceScore: estimateFallbackConfidence(input),
    warnings: ["Versao editorial curta gerada a partir do resumo da fonte original."],
    originalSummary,
    usedAI: false,
    isFallback: true,
  }
}

async function requestOpenAIExpandedContent(input: EditorialGenerationInput) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EDITORIAL_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "expanded_editorial_article_ptbr",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              titlePt: { type: "string" },
              subtitlePt: { type: "string" },
              contentPt: { type: "string" },
              historicalContextPt: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              editorialNotePt: { type: "string" },
              confidenceScore: { type: "number" },
              warnings: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["titlePt", "subtitlePt", "contentPt", "historicalContextPt", "editorialNotePt", "confidenceScore", "warnings"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            'Voce e um editor de noticias em portugues do Brasil. Reescreva e expanda o conteudo abaixo com tom jornalistico natural, claro e sobrio. Use apenas as informacoes fornecidas. Nao invente fatos, numeros, nomes, datas, falas ou contexto externo. Quando houver pouca informacao, escreva menos. O texto final deve parecer uma materia curta publicada em um portal de noticias brasileiro. Nunca mencione que e uma IA, que esta expandindo um resumo, nem explique limitacoes no corpo do texto. Traduza titulo, subtitulo, resumo e corpo final para portugues do Brasil. Use datas em formato brasileiro. Retorne de 3 a 6 paragrafos no campo contentPt quando houver base suficiente; se a base for curta, entregue menos paragrafos. So preencha historicalContextPt quando houver base suficiente nas entradas.',
        },
        {
          role: "user",
          content: JSON.stringify({
            ...input,
            pubDate: formatPtDate(input.pubDate) || input.pubDate,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const rawContent = data.choices?.[0]?.message?.content

  if (!rawContent) {
    return null
  }

  return JSON.parse(rawContent) as OpenAIEditorialResponse
}

export async function generateExpandedContent(
  article: Pick<SiteNewsArticle, "titulo" | "descricao" | "fonte" | "data" | "categoria" | "tags">,
  relatedArticles: Array<Pick<SiteNewsArticle, "titulo" | "descricao" | "fonte" | "categoria">> = [],
): Promise<ExpandedContentResult> {
  const input: EditorialGenerationInput = {
    title: normalizeWhitespace(article.titulo),
    summary: normalizeWhitespace(article.descricao || article.titulo),
    source: normalizeWhitespace(article.fonte),
    pubDate: normalizeWhitespace(article.data),
    category: normalizeWhitespace(article.categoria),
    tags: article.tags,
    relatedArticles: relatedArticles.map((related) => ({
      title: normalizeWhitespace(related.titulo),
      summary: normalizeWhitespace(related.descricao),
      source: normalizeWhitespace(related.fonte),
      category: normalizeWhitespace(related.categoria),
    })),
  }

  const fallback = buildFallbackExpandedContent(input)

  try {
    const aiResult = await requestOpenAIExpandedContent(input)

    if (!aiResult) {
      return fallback
    }

    const normalizedResult: OpenAIEditorialResponse = {
      titlePt: normalizeWhitespace(aiResult.titlePt),
      subtitlePt: normalizeWhitespace(aiResult.subtitlePt),
      contentPt: keepShortWhenLowConfidence(normalizeParagraphCount(aiResult.contentPt), aiResult.confidenceScore),
      historicalContextPt: aiResult.historicalContextPt
        ? keepShortWhenLowConfidence(normalizeParagraphCount(aiResult.historicalContextPt, 3), aiResult.confidenceScore)
        : null,
      editorialNotePt: normalizeWhitespace(aiResult.editorialNotePt) || DEFAULT_EDITORIAL_NOTE,
      confidenceScore: Math.max(0, Math.min(100, Math.round(aiResult.confidenceScore))),
      warnings: aiResult.warnings,
    }

    const validation = sanitizeGeneratedResult(normalizedResult, input)

    if (!normalizedResult.contentPt || validation.hasUnsafeContent) {
      return {
        ...fallback,
        confidenceScore: Math.min(fallback.confidenceScore, 55),
        warnings: [...fallback.warnings, ...validation.warnings],
      }
    }

    if (normalizedResult.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
      return {
        ...fallback,
        titlePt: normalizedResult.titlePt || fallback.titlePt,
        subtitlePt: normalizedResult.subtitlePt || fallback.subtitlePt,
        contentPt: normalizedResult.subtitlePt || fallback.contentPt,
        editorialNotePt: normalizedResult.editorialNotePt || DEFAULT_EDITORIAL_NOTE,
        confidenceScore: normalizedResult.confidenceScore,
        warnings: normalizedResult.warnings,
        usedAI: true,
      }
    }

    return {
      titlePt: normalizedResult.titlePt || fallback.titlePt,
      subtitlePt: normalizedResult.subtitlePt || fallback.subtitlePt,
      contentPt: normalizedResult.contentPt,
      historicalContextPt: normalizedResult.historicalContextPt || undefined,
      editorialNotePt: normalizedResult.editorialNotePt || DEFAULT_EDITORIAL_NOTE,
      confidenceScore: normalizedResult.confidenceScore,
      warnings: normalizedResult.warnings,
      originalSummary: fallback.originalSummary,
      usedAI: true,
      isFallback: false,
    }
  } catch {
    return fallback
  }
}
