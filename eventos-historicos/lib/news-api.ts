import type { SiteNewsArticle } from "@/lib/news"

const LAMBDA_API_URL = (process.env.LAMBDA_API_URL ?? "").replace(/\/$/, "")

async function apiFetch<T>(path: string): Promise<T | null> {
  if (!LAMBDA_API_URL) return null
  try {
    const res = await fetch(`${LAMBDA_API_URL}${path}`, {
      next: { revalidate: 90 },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchRssArticlesFromApi(limit = 20): Promise<SiteNewsArticle[]> {
  const articles = await apiFetch<SiteNewsArticle[]>("/noticias")
  return (articles ?? []).slice(0, limit)
}

export async function fetchArticleBySlugFromApi(slug: string): Promise<SiteNewsArticle | null> {
  return apiFetch<SiteNewsArticle>(`/noticias/${encodeURIComponent(slug)}`)
}

export function isLambdaConfigured(): boolean {
  return Boolean(LAMBDA_API_URL)
}
