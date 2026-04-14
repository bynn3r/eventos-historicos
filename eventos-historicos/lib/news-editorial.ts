import type { SiteNewsArticle } from "@/lib/news"

interface RelatedEditorialArticle {
  title: string
  summary: string
  source: string
  category: string
}

export interface ExpandedContentResult {
  expandedContent: string
  confidenceScore: number
  warnings: string[]
  historicalContext?: string
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
  expandedContent: string
  confidenceScore: number
  warnings: string[]
  historicalContext: string | null
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_EDITORIAL_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-5-mini"

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function extractNumbers(value: string) {
  return value.match(/\b\d[\d.,:%/-]*\b/g) ?? []
}

function extractQuotedText(value: string) {
  return value.match(/["“][^"”]+["”]/g) ?? []
}

function extractNamedEntities(value: string) {
  const uppercaseEntities = value.match(/\b[A-Z]{2,}(?:-[A-Z]{2,})*\b/g) ?? []
  const multiWordEntities = value.match(/\b[A-ZÀ-Ý][\p{L}\-']+(?:\s+[A-ZÀ-Ý][\p{L}\-']+)+/gu) ?? []
  return [...new Set([...uppercaseEntities, ...multiWordEntities].map((entity) => normalizeWhitespace(entity)))]
}

function splitIntoParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)
}

function estimateFallbackConfidence(input: EditorialGenerationInput) {
  const summaryLength = normalizeWhitespace(input.summary).length
  const relatedBonus = Math.min(input.relatedArticles?.length ?? 0, 2) * 6

  if (summaryLength >= 420) {
    return 74 + relatedBonus
  }

  if (summaryLength >= 240) {
    return 66 + relatedBonus
  }

  if (summaryLength >= 140) {
    return 58 + relatedBonus
  }

  return 46 + relatedBonus
}

function buildFallbackHistoricalContext(input: EditorialGenerationInput) {
  const relatedSameCategory = (input.relatedArticles ?? []).filter((article) => article.category === input.category)

  if (input.category === "História" && relatedSameCategory.length > 0) {
    return `A cobertura relacionada sugere que o tema faz parte de um quadro histórico mais amplo, mas o material-base disponível aqui não detalha antecedentes adicionais com precisão suficiente para ampliá-los além deste contexto.`
  }

  if (input.category === "Geopolítica" || input.category === "Conflitos" || input.category === "Política") {
    return relatedSameCategory.length > 0
      ? `Matérias relacionadas indicam que o episódio acompanha uma sequência maior de cobertura sobre ${input.category.toLowerCase()}, embora o resumo original não traga elementos suficientes para reconstruir toda essa cronologia com segurança.`
      : undefined
  }

  return undefined
}

function buildFallbackExpandedContent(input: EditorialGenerationInput): ExpandedContentResult {
  const summary = normalizeWhitespace(input.summary || input.title)
  const lead = summary || input.title
  const paragraphs = [
    lead,
    `De acordo com a cobertura publicada por ${input.source} em ${input.pubDate}, o tema foi classificado em ${input.category.toLowerCase()}. O material disponível indica esse desenvolvimento, mas não oferece todos os detalhes normalmente presentes em uma reportagem completa.`,
  ]

  if (summary.length >= 140) {
    paragraphs.push(
      `No recorte apresentado pela fonte original, os elementos centrais apontam para desdobramentos relevantes do caso, com possível impacto político, diplomático, econômico ou histórico conforme a natureza da notícia. Como o texto-base é resumido, esta versão editorial preserva apenas o que já aparece no resumo original.`,
    )
  }

  if ((input.relatedArticles ?? []).length > 0) {
    paragraphs.push(
      `A cobertura relacionada sugere que o assunto vem sendo acompanhado em conjunto com outros acontecimentos próximos, o que ajuda a situar a notícia em um contexto maior sem acrescentar fatos que não estejam confirmados no material-base desta publicação.`,
    )
  }

  return {
    expandedContent: paragraphs.join("\n\n"),
    confidenceScore: estimateFallbackConfidence(input),
    warnings: ["Texto editorial expandido com base no resumo da fonte original."],
    historicalContext: buildFallbackHistoricalContext(input),
    originalSummary: summary,
    usedAI: false,
    isFallback: true,
  }
}

function sanitizeGeneratedResult(result: OpenAIEditorialResponse, input: EditorialGenerationInput) {
  const allowedText = [
    input.title,
    input.summary,
    input.source,
    input.pubDate,
    input.category,
    ...input.tags,
    ...(input.relatedArticles ?? []).flatMap((article) => [article.title, article.summary, article.source, article.category]),
  ].join(" ")

  const allowedNumbers = new Set(extractNumbers(allowedText))
  const allowedQuotes = new Set(extractQuotedText(allowedText))
  const allowedEntities = new Set(extractNamedEntities(allowedText))

  const outputNumbers = extractNumbers(result.expandedContent)
  const outputQuotes = extractQuotedText(result.expandedContent)
  const outputEntities = extractNamedEntities(`${result.expandedContent}\n${result.historicalContext ?? ""}`)

  const unexpectedNumbers = outputNumbers.filter((value) => !allowedNumbers.has(value))
  const unexpectedQuotes = outputQuotes.filter((value) => !allowedQuotes.has(value))
  const unexpectedEntities = outputEntities.filter((value) => !allowedEntities.has(value) && value !== input.source)

  return {
    hasUnsafeContent: unexpectedNumbers.length > 0 || unexpectedQuotes.length > 0 || unexpectedEntities.length > 2,
    warnings: [
      ...(unexpectedNumbers.length > 0 ? ["A saída expandida incluiu números não confirmados pelas entradas."] : []),
      ...(unexpectedQuotes.length > 0 ? ["A saída expandida incluiu citações não presentes no material-base."] : []),
      ...(unexpectedEntities.length > 2 ? ["A saída expandida incluiu referências nominais fora das entradas fornecidas."] : []),
    ],
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
          name: "expanded_editorial_article",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              expandedContent: { type: "string" },
              confidenceScore: { type: "number" },
              warnings: {
                type: "array",
                items: { type: "string" },
              },
              historicalContext: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
            },
            required: ["expandedContent", "confidenceScore", "warnings", "historicalContext"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Você é um editor de notícias. Expanda o texto somente com base na entrada recebida. Não invente fatos, nomes, números, datas, lugares, declarações ou citações. Preserve o idioma predominante da entrada. Se a base for curta, gere um texto curto e neutro. Se não houver base suficiente para contexto histórico, retorne historicalContext como null.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
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

    const normalizedExpanded = splitIntoParagraphs(aiResult.expandedContent).join("\n\n")
    const normalizedHistorical = aiResult.historicalContext ? splitIntoParagraphs(aiResult.historicalContext).join("\n\n") : undefined
    const validation = sanitizeGeneratedResult(
      {
        ...aiResult,
        expandedContent: normalizedExpanded,
        historicalContext: normalizedHistorical ?? null,
      },
      input,
    )

    if (!normalizedExpanded || validation.hasUnsafeContent) {
      return {
        ...fallback,
        confidenceScore: Math.min(fallback.confidenceScore, 55),
        warnings: [...fallback.warnings, ...validation.warnings],
      }
    }

    return {
      expandedContent: normalizedExpanded,
      confidenceScore: Math.max(0, Math.min(100, Math.round(aiResult.confidenceScore))),
      warnings: aiResult.warnings.length > 0 ? aiResult.warnings : fallback.warnings,
      historicalContext: normalizedHistorical,
      originalSummary: fallback.originalSummary,
      usedAI: true,
      isFallback: false,
    }
  } catch {
    return {
      ...fallback,
      warnings: [...fallback.warnings, "A geração assistida por IA falhou e o site exibiu uma versão editorial segura."],
    }
  }
}
