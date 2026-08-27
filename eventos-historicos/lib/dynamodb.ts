import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import type { SiteNewsArticle } from "@/lib/news"

const TABLE = process.env.DYNAMODB_NOTICIAS_TABLE ?? "eventos-historicos-noticias"
const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

let _client: DynamoDBDocumentClient | null = null

function getClient(): DynamoDBDocumentClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.Access_key
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.Secret_access_key
  const region = process.env.AWS_REGION ?? "us-east-1"

  if (!accessKeyId || !secretAccessKey) return null
  if (_client) return _client

  const raw = new DynamoDBClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })

  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  })
  return _client
}

export async function saveNoticiaDb(article: SiteNewsArticle): Promise<void> {
  const client = getClient()
  if (!client) return

  try {
    await client.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...article,
          expiresAt: Math.floor(Date.now() / 1000) + TTL_SECONDS,
        },
      }),
    )
  } catch (err) {
    console.error("[dynamodb] saveNoticiaDb error:", err)
  }
}

export async function getNoticiaDb(slug: string): Promise<SiteNewsArticle | null> {
  const client = getClient()
  if (!client) {
    console.warn("[dynamodb] getNoticiaDb: no credentials configured")
    return null
  }

  try {
    const result = await client.send(
      new GetCommand({ TableName: TABLE, Key: { slug } }),
    )
    return (result.Item as SiteNewsArticle) ?? null
  } catch (err) {
    console.error("[dynamodb] getNoticiaDb error:", err)
    return null
  }
}

export async function listNoticiasDb(limit = 20): Promise<SiteNewsArticle[]> {
  const client = getClient()
  if (!client) {
    console.warn("[dynamodb] listNoticiasDb: no credentials configured")
    return []
  }

  try {
    const result = await client.send(
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
  } catch (err) {
    console.error("[dynamodb] listNoticiasDb error:", err)
    return []
  }
}

export async function noticiaExistsDb(slug: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  try {
    const result = await client.send(
      new GetCommand({
        TableName: TABLE,
        Key: { slug },
        ProjectionExpression: "slug, resumo",
      }),
    )
    const item = result.Item as { slug?: string; resumo?: boolean } | undefined
    // Only consider "exists" when we have the full enriched article
    return Boolean(item?.slug && item.resumo === false)
  } catch {
    return false
  }
}
