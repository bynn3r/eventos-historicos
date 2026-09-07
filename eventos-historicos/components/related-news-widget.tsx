"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Newspaper } from "lucide-react"

interface NewsItem {
  slug: string
  titulo: string
  descricao: string
  data: string
  categoria: string
  href: string
}

interface RelatedNewsWidgetProps {
  keywords: string[]
}

export function RelatedNewsWidget({ keywords }: RelatedNewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (keywords.length === 0) {
      setReady(true)
      return
    }
    // Use up to 10 most specific keywords (longer = more discriminating)
    const kws = [...keywords]
      .sort((a, b) => b.length - a.length)
      .slice(0, 10)
      .join(",")

    fetch(`/api/noticias/related?keywords=${encodeURIComponent(kws)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NewsItem[]) => {
        setNews(data)
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  if (!ready || news.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Newspaper className="h-5 w-5" />
        Notícias Recentes Relacionadas
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {news.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className="group block p-5 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <Badge variant="secondary" className="mb-2 text-xs">
              {item.categoria}
            </Badge>
            <h3 className="font-semibold text-sm leading-6 group-hover:text-primary transition-colors line-clamp-2">
              {item.titulo}
            </h3>
            {item.descricao && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">
                {item.descricao}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
