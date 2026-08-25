import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import type { SiteNewsArticle } from "@/lib/news"

const TABLE_NAME = "eventos-historicos-news-cache"
const REGION = "us-east-1"
const CACHE_KEY = "rss-articles-v1"
const MAX_CACHE_AGE_MS = 60 * 60 * 1000 // 1 hour

let docClient: DynamoDBDocumentClient | null = null

// TEMPORARY: surfaced by /api/cron/refresh-news while diagnosing why writes
// fail in production — remove once resolved.
export let lastCacheError: string | null = null

function getDocClient() {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
      marshallOptions: { removeUndefinedValues: true },
    })
  }
  return docClient
}

interface CachedPayload {
  updatedAt: string
  articles: SiteNewsArticle[]
}

export async function readCachedArticles(): Promise<SiteNewsArticle[] | null> {
  try {
    const result = await getDocClient().send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { cacheKey: CACHE_KEY },
      }),
    )

    const payload = result.Item as CachedPayload | undefined
    if (!payload?.articles?.length) {
      return null
    }

    const age = Date.now() - new Date(payload.updatedAt).getTime()
    if (Number.isNaN(age) || age > MAX_CACHE_AGE_MS) {
      return null
    }

    return payload.articles
  } catch {
    // Cache is a pure optimization — any failure (missing table, permissions,
    // throttling) just means "compute live" like before this existed.
    return null
  }
}

export async function writeCachedArticles(articles: SiteNewsArticle[]): Promise<boolean> {
  try {
    const payload: CachedPayload = {
      updatedAt: new Date().toISOString(),
      articles,
    }

    await getDocClient().send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { cacheKey: CACHE_KEY, ...payload },
      }),
    )

    return true
  } catch (error) {
    lastCacheError = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    return false
  }
}
