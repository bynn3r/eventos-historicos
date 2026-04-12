"use client"

import { useEffect, useState } from "react"
import { HomePageClient } from "@/components/home-page-client"
import type { SiteNewsArticle } from "@/lib/news"

export function HomePageRuntime() {
  const [featuredNews, setFeaturedNews] = useState<SiteNewsArticle[]>([])

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch("/api/noticias")
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { combinedArticles?: SiteNewsArticle[] }
        setFeaturedNews(data.combinedArticles?.slice(0, 4) ?? [])
      } catch (error) {
        console.error("Falha ao carregar notícias em destaque:", error)
      }
    }

    loadNews()
  }, [])

  return <HomePageClient featuredNews={featuredNews} />
}
