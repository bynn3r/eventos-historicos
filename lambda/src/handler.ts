import { refreshArticles } from "./process.js"
import { listArticles, getArticle } from "./dynamodb.js"

interface FunctionUrlEvent {
  version?: string
  requestContext?: {
    http?: { method: string; path: string }
  }
  headers?: Record<string, string>
  rawPath?: string
}

interface EventBridgeEvent {
  source?: string
  "detail-type"?: string
}

type LambdaEvent = FunctionUrlEvent & EventBridgeEvent

function jsonResponse(statusCode: number, body: unknown, headers?: Record<string, string>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

function isAuthorized(event: FunctionUrlEvent): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = event.headers?.authorization || event.headers?.Authorization
  return auth === `Bearer ${secret}`
}

export const handler = async (event: LambdaEvent) => {
  // EventBridge Scheduler / EventBridge Rules trigger
  const isScheduled = event.source?.startsWith("aws.") || event["detail-type"] === "Scheduled Event"
  if (isScheduled) {
    console.log("[handler] EventBridge trigger — refreshing articles")
    const result = await refreshArticles()
    return { statusCode: 200, body: JSON.stringify({ ok: true, ...result }) }
  }

  // Lambda Function URL — HTTP routing
  const method = event.requestContext?.http?.method?.toUpperCase() ?? "GET"
  const path = event.rawPath ?? event.requestContext?.http?.path ?? "/"

  if (method === "OPTIONS") {
    return jsonResponse(204, null, {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type",
    })
  }

  // POST /refresh — manual trigger (QStash or curl)
  if (method === "POST" && path === "/refresh") {
    if (!isAuthorized(event)) return jsonResponse(401, { error: "unauthorized" })
    console.log("[handler] POST /refresh — manual trigger")
    const result = await refreshArticles()
    return jsonResponse(200, { ok: true, at: new Date().toISOString(), ...result })
  }

  // GET /noticias — list recent articles
  if (method === "GET" && path === "/noticias") {
    const articles = await listArticles(20)
    return jsonResponse(200, articles)
  }

  // GET /noticias/{slug} — single article
  const slugMatch = path.match(/^\/noticias\/([^/]+)$/)
  if (method === "GET" && slugMatch) {
    const article = await getArticle(slugMatch[1])
    if (!article) return jsonResponse(404, { error: "not_found" })
    return jsonResponse(200, article)
  }

  return jsonResponse(404, { error: "not_found" })
}
