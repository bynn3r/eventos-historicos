import type { SiteNewsArticle } from "@/lib/news"

interface PortalAnalysisInput {
  themeId: string
  themeLabel: string
  category: string
  tags: string[]
  sourceArticles: Array<Pick<SiteNewsArticle, "titulo" | "descricao" | "fonte" | "data" | "categoria" | "linkFonte">>
}

interface PortalAnalysisResponse {
  titlePt: string
  summaryPt: string
  analysisPt: string
  globalImpactPt: string
  historicalContextPt: string | null
  editorialNotePt: string
}

export interface GeneratedPortalAnalysis {
  titlePt: string
  summaryPt: string
  analysisPt: string
  globalImpactPt: string
  historicalContextPt?: string
  editorialNotePt: string
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_EDITORIAL_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-5-mini"
const DEFAULT_EDITORIAL_NOTE = "Conteudo adaptado editorialmente a partir de um conjunto de fontes originais."

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

function buildFallbackPortalAnalysis(input: PortalAnalysisInput): GeneratedPortalAnalysis {
  const headlines = input.sourceArticles.slice(0, 3).map((article) => normalizeWhitespace(article.titulo))
  const summaries = input.sourceArticles
    .slice(0, 3)
    .map((article) => normalizeWhitespace(article.descricao))
    .filter(Boolean)

  const lead = summaries[0] || headlines[0] || `A cobertura recente sobre ${input.themeLabel.toLowerCase()} ganhou densidade nos feeds monitorados pelo portal.`
  const secondParagraph =
    summaries[1] ||
    `As publicacoes reunidas apontam para uma mesma frente de desenvolvimento em ${input.themeLabel.toLowerCase()}, com impactos que ultrapassam o fato isolado e ajudam a explicar o momento politico e estrategico em curso.`
  const impactParagraph =
    `No plano internacional, o tema toca debates de ${input.category.toLowerCase()} e ajuda a medir efeitos sobre diplomacia, seguranca, economia e percepcao de risco entre os atores envolvidos.`

  return {
    titlePt: `Analise: ${headlines[0] || input.themeLabel}`,
    summaryPt: lead,
    analysisPt: [lead, secondParagraph, impactParagraph].join("\n\n"),
    globalImpactPt: impactParagraph,
    historicalContextPt: input.category === "Historia" ? "O tema se conecta a um quadro historico mais amplo, mas o aprofundamento depende da evolucao da cobertura reunida." : undefined,
    editorialNotePt: DEFAULT_EDITORIAL_NOTE,
  }
}

async function requestOpenAIPortalAnalysis(input: PortalAnalysisInput) {
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
          name: "portal_analysis_ptbr",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              titlePt: { type: "string" },
              summaryPt: { type: "string" },
              analysisPt: { type: "string" },
              globalImpactPt: { type: "string" },
              historicalContextPt: { anyOf: [{ type: "string" }, { type: "null" }] },
              editorialNotePt: { type: "string" },
            },
            required: ["titlePt", "summaryPt", "analysisPt", "globalImpactPt", "historicalContextPt", "editorialNotePt"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Voce e editor de um portal brasileiro de geopolitica e historia. Produza uma analise editorial em portugues do Brasil com base apenas no conjunto de noticias fornecido. Nao invente fatos, nomes, datas, falas ou numeros. Organize o texto como artigo curto de portal: titulo forte, resumo curto, analise principal em 3 a 5 paragrafos, impacto global e contexto historico apenas se houver base suficiente. Tom natural, profissional, claro e sem linguagem robotica. Nao mencione IA no titulo nem no corpo principal.",
        },
        {
          role: "user",
          content: JSON.stringify({
            ...input,
            sourceArticles: input.sourceArticles.map((article) => ({
              ...article,
              data: formatPtDate(article.data) || article.data,
            })),
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(18_000),
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

  return JSON.parse(rawContent) as PortalAnalysisResponse
}

export async function generatePortalAnalysis(input: PortalAnalysisInput): Promise<GeneratedPortalAnalysis> {
  const fallback = buildFallbackPortalAnalysis(input)

  try {
    const result = await requestOpenAIPortalAnalysis(input)

    if (!result) {
      return fallback
    }

    return {
      titlePt: normalizeWhitespace(result.titlePt) || fallback.titlePt,
      summaryPt: normalizeWhitespace(result.summaryPt) || fallback.summaryPt,
      analysisPt: splitIntoParagraphs(result.analysisPt).slice(0, 5).join("\n\n") || fallback.analysisPt,
      globalImpactPt: splitIntoParagraphs(result.globalImpactPt).slice(0, 2).join("\n\n") || fallback.globalImpactPt,
      historicalContextPt: result.historicalContextPt ? splitIntoParagraphs(result.historicalContextPt).slice(0, 2).join("\n\n") : undefined,
      editorialNotePt: normalizeWhitespace(result.editorialNotePt) || DEFAULT_EDITORIAL_NOTE,
    }
  } catch {
    return fallback
  }
}
