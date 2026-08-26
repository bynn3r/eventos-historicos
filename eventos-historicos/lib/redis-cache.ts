import { Redis } from "@upstash/redis"
import type { SiteNewsArticle } from "@/lib/news"

// Versioned key — bump when SiteNewsArticle shape changes to avoid stale schema
const CACHE_KEY = "noticias:rss:v3"
const CACHE_TTL_SECONDS = 3600 // 1 hour

let client: Redis | null = null

function getClient(): Redis | null {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  client = new Redis({ url, token })
  return client
}

export async function getCachedRssArticles(): Promise<SiteNewsArticle[] | null> {
  const redis = getClient()
  if (!redis) return null
  try {
    return await redis.get<SiteNewsArticle[]>(CACHE_KEY)
  } catch {
    return null
  }
}

export async function setCachedRssArticles(articles: SiteNewsArticle[]): Promise<void> {
  const redis = getClient()
  if (!redis) return
  try {
    await redis.set(CACHE_KEY, articles, { ex: CACHE_TTL_SECONDS })
  } catch {
    // non-fatal — next request will just recompute
  }
}
