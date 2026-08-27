import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import type { SiteNewsArticle } from "./types.js"

const TABLE = process.env.DYNAMODB_NOTICIAS_TABLE ?? "eventos-historicos-noticias"
const TTL_SECONDS = 30 * 24 * 60 * 60

let _client: DynamoDBDocumentClient | null = null

function getClient(): DynamoDBDocumentClient {
  if (_client) return _client
  const raw = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" })
  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  })
  return _client
}

export async function saveArticle(article: SiteNewsArticle): Promise<void> {
  try {
    await getClient().send(
      new PutCommand({
        TableName: TABLE,
        Item: { ...article, expiresAt: Math.floor(Date.now() / 1000) + TTL_SECONDS },
      }),
    )
  } catch (err) {
    console.error("[dynamodb] saveArticle:", err)
  }
}

export async function getArticle(slug: string): Promise<SiteNewsArticle | null> {
  try {
    const result = await getClient().send(new GetCommand({ TableName: TABLE, Key: { slug } }))
    return (result.Item as SiteNewsArticle) ?? null
  } catch {
    return null
  }
}

const GENERIC_IMAGES = new Set([
  "/historical-books-and-world-map-study.jpg",
  "/world-map-with-geopolitical-tensions.jpg",
  "/geopolitics-world-map-with-news-overlay.jpg",
])

export async function articleExistsFull(slug: string): Promise<boolean> {
  try {
    const result = await getClient().send(
      new GetCommand({ TableName: TABLE, Key: { slug }, ProjectionExpression: "slug, resumo, imagem" }),
    )
    const item = result.Item as { slug?: string; resumo?: boolean; imagem?: string } | undefined
    if (!item?.slug || item.resumo !== false) return false
    // Re-process articles with missing or generic images even when text is enriched
    if (!item.imagem || GENERIC_IMAGES.has(item.imagem)) return false
    return true
  } catch {
    return false
  }
}

export async function listArticles(limit = 20): Promise<SiteNewsArticle[]> {
  try {
    const result = await getClient().send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "tipo-data-index",
        KeyConditionExpression: "#tipo = :tipo",
        ExpressionAttributeNames: { "#tipo": "tipo" },
        ExpressionAttributeValues: { ":tipo": "rss" },
        ScanIndexForward: false,
        Limit: limit,
      }),
    )
    return (result.Items as SiteNewsArticle[]) ?? []
  } catch {
    return []
  }
}
