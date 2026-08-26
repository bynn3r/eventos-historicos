import type { SiteNewsArticle } from "@/lib/news"
import { createHmac, createHash } from "crypto"

const LAMBDA_API_URL = (process.env.LAMBDA_API_URL ?? "").replace(/\/$/, "")
const AWS_REGION = process.env.AWS_REGION ?? "us-east-1"
const AWS_ACCESS_KEY = process.env.Access_key ?? process.env.AWS_ACCESS_KEY_ID ?? ""
const AWS_SECRET_KEY = process.env.Secret_access_key ?? process.env.AWS_SECRET_ACCESS_KEY ?? ""

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest()
}
function hexHash(data: string): string {
  return createHash("sha256").update(data).digest("hex")
}

function buildSignedHeaders(url: string, method: string): Record<string, string> {
  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY) return {}

  const parsed = new URL(url)
  const now = new Date()
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "")
  const amzdate = datestamp + "T" + now.toISOString().slice(11, 19).replace(/:/g, "") + "Z"

  const host = parsed.hostname
  const path = parsed.pathname
  const payloadHash = hexHash("")
  const service = "lambda"

  const headerMap: Record<string, string> = {
    host,
    "x-amz-date": amzdate,
    "x-amz-content-sha256": payloadHash,
  }

  const sortedKeys = Object.keys(headerMap).sort()
  const signedHeaders = sortedKeys.join(";")
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headerMap[k]}`).join("\n") + "\n"
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n")
  const credentialScope = `${datestamp}/${AWS_REGION}/${service}/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzdate}\n${credentialScope}\n${hexHash(canonicalRequest)}`

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${AWS_SECRET_KEY}`, datestamp), AWS_REGION), service),
    "aws4_request",
  )
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  headerMap["authorization"] =
    `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return headerMap
}

async function apiFetch<T>(path: string): Promise<T | null> {
  if (!LAMBDA_API_URL) return null
  const url = `${LAMBDA_API_URL}${path}`
  try {
    const signedHeaders = buildSignedHeaders(url, "GET")
    const res = await fetch(url, {
      next: { revalidate: 90 },
      headers: { Accept: "application/json", ...signedHeaders },
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
