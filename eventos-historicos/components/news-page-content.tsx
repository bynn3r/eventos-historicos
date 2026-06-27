"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Calendar, ExternalLink, Clock } from "lucide-react"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { NewsImage } from "@/components/news-image"
import { Button } from "@/components/ui/button"
import { formatNewsDate, hasContextualImage, type SiteNewsArticle } from "@/lib/news"

const CATEGORIES = [
  "Todas",
  "Geopolítica",
  "Conflitos",
  "Política",
  "Economia Global",
  "História",
  "Exploração Espacial",
]

const CATEGORY_COLORS: Record<string, string> = {
  Conflitos: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  Geopolítica: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Política: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  "Economia Global": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  História: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  "Exploração Espacial": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
}

const CATEGORY_BAR: Record<string, string> = {
  Conflitos: "bg-red-500",
  Geopolítica: "bg-blue-500",
  Política: "bg-purple-500",
  "Economia Global": "bg-emerald-500",
  História: "bg-amber-500",
  "Exploração Espacial": "bg-indigo-500",
}

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${Math.max(1, minutes)} min`
}

interface NewsPageContentProps {
  rssArticles: SiteNewsArticle[]
  localArticles: SiteNewsArticle[]
}

export function NewsPageContent({ rssArticles, localArticles }: NewsPageContentProps) {
  const [activeCategory, setActiveCategory] = useState("Todas")

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: rssArticles.length }
    for (const article of rssArticles) {
      counts[article.categoria] = (counts[article.categoria] ?? 0) + 1
    }
    return counts
  }, [rssArticles])

  const filteredArticles = useMemo(
    () => (activeCategory === "Todas" ? rssArticles : rssArticles.filter((a) => a.categoria === activeCategory)),
    [rssArticles, activeCategory],
  )

  const featured = filteredArticles.find(hasContextualImage) ?? filteredArticles[0]
  const gridArticles = filteredArticles.filter((a) => a.id !== featured?.id)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-background py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Notícias</h1>
            <p className="text-muted-foreground mb-6">
              Geopolítica, história e eventos de impacto global — em português
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {CATEGORIES.filter((cat) => cat === "Todas" || (categoryCounts[cat] ?? 0) > 0).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {cat}
                  {categoryCounts[cat] != null && (
                    <span className="ml-1.5 opacity-60 text-xs">{categoryCounts[cat]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 space-y-10">
          {/* Featured */}
          {featured && (
            <div className="grid md:grid-cols-[3fr_2fr] rounded-2xl overflow-hidden border bg-card">
              {hasContextualImage(featured) && (
                <Link
                  href={featured.href}
                  className="relative aspect-[16/10] md:aspect-auto block overflow-hidden"
                >
                  <NewsImage
                    src={featured.imagem}
                    alt={featured.titulo}
                    fill
                    className="object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </Link>
              )}
              <div className="p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[featured.categoria] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {featured.categoria}
                    </span>
                    <span className="text-xs text-muted-foreground">{featured.fonte}</span>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight mb-3">
                    <Link href={featured.href} className="hover:text-primary transition-colors">
                      {featured.titulo}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">{featured.descricao}</p>
                </div>
                <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatNewsDate(featured.data)}
                    <span aria-hidden>·</span>
                    <Clock className="h-3.5 w-3.5" />
                    {readingTime(featured.descricao)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" asChild>
                      <Link href={featured.href}>Ler</Link>
                    </Button>
                    {featured.linkFonte && (
                      <a
                        href={featured.linkFonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver fonte original"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridArticles.map((article) => (
                <Link
                  key={article.id}
                  href={article.href}
                  className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  {hasContextualImage(article) ? (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <NewsImage
                        src={article.imagem}
                        alt={article.titulo}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className={`h-1 w-full ${CATEGORY_BAR[article.categoria] ?? "bg-muted"}`} />
                  )}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="mb-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[article.categoria] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {article.categoria}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[0.9rem] leading-snug mb-2 line-clamp-3 group-hover:text-primary transition-colors flex-1">
                      {article.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {article.descricao}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatNewsDate(article.data)}
                      </div>
                      <span className="truncate max-w-[90px] text-right">{article.fonte}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filteredArticles.length === 0 && (
            <div className="py-24 text-center text-muted-foreground">
              Nenhuma notícia nesta categoria no momento.
            </div>
          )}

          {/* Analyses — só na aba "Todas" */}
          {localArticles.length > 0 && activeCategory === "Todas" && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold">Análises do portal</h2>
                <p className="text-sm text-muted-foreground">
                  Editorial gerado a partir das principais notícias do momento
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {localArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={article.href}
                    className="group flex flex-col rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <NewsImage
                        src={article.imagem}
                        alt={article.titulo}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          Análise
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-semibold text-[0.9rem] leading-snug mb-2 line-clamp-3 group-hover:text-primary transition-colors flex-1">
                        {article.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {article.descricao}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                        <Calendar className="h-3 w-3" />
                        {formatNewsDate(article.data)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
