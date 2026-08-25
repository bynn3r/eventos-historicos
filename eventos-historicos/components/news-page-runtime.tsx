"use client"

import { useEffect, useState } from "react"
import { NewsPageContent } from "@/components/news-page-content"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import type { SiteNewsArticle } from "@/lib/news"

function NewsPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="border-b bg-background py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Notícias</h1>
            <p className="text-muted-foreground mb-6">
              Geopolítica, história e eventos de impacto global — em português
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 space-y-10">
          <div className="grid md:grid-cols-[3fr_2fr] gap-0 rounded-2xl overflow-hidden border bg-card animate-pulse">
            <div className="aspect-[16/10] md:aspect-auto bg-muted" />
            <div className="p-7 space-y-4">
              <div className="h-4 w-24 rounded-full bg-muted" />
              <div className="h-6 w-full rounded bg-muted" />
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 rounded-full bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function NewsPageError() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Não foi possível carregar as notícias agora. Tente recarregar a página.</p>
      </main>
      <Footer />
    </div>
  )
}

export function NewsPageRuntime() {
  const [rssArticles, setRssArticles] = useState<SiteNewsArticle[]>([])
  const [localArticles, setLocalArticles] = useState<SiteNewsArticle[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch("/api/noticias")
        if (!response.ok) {
          throw new Error("Falha ao carregar noticias")
        }

        const data = (await response.json()) as { rssArticles?: SiteNewsArticle[]; localArticles?: SiteNewsArticle[] }

        if (!cancelled) {
          setRssArticles(data.rssArticles ?? [])
          setLocalArticles(data.localArticles ?? [])
          setStatus("ready")
        }
      } catch (error) {
        console.error("Falha ao carregar noticias:", error)
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === "loading") {
    return <NewsPageSkeleton />
  }

  if (status === "error") {
    return <NewsPageError />
  }

  return <NewsPageContent rssArticles={rssArticles} localArticles={localArticles} />
}
