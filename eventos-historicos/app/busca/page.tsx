"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { SearchResultItem } from "@/app/api/busca/route"

const CONTENT_TYPES = ["all", "evento", "curiosidade", "personagem", "noticia"] as const

const TYPE_LABELS: Record<string, string> = {
  all: "Todos",
  evento: "Eventos",
  curiosidade: "Curiosidades",
  personagem: "Personagens",
  noticia: "Notícias",
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  evento: "bg-purple-500",
  curiosidade: "bg-green-500",
  personagem: "bg-amber-500",
  noticia: "bg-blue-500",
}

const SUGGESTIONS = [
  { term: "Segunda Guerra Mundial", description: "Eventos e análises do maior conflito da história" },
  { term: "Império Romano", description: "História e curiosidades sobre Roma Antiga" },
  { term: "Guerra Fria", description: "Tensões entre EUA e URSS no século XX" },
  { term: "Revolução Francesa", description: "O movimento que mudou a França e o mundo" },
  { term: "Napoleão", description: "Ascensão e queda do imperador francês" },
  { term: "Oriente Médio", description: "Geopolítica e conflitos na região" },
]

export default function BuscaPage() {
  const searchParams = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get("q") || "")
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Debounce input -> searchTerm
  useEffect(() => {
    const handle = setTimeout(() => setSearchTerm(inputValue.trim()), 350)
    return () => clearTimeout(handle)
  }, [inputValue])

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const controller = new AbortController()

    const params = new URLSearchParams({ q: searchTerm, type: selectedType, category: selectedCategory })
    fetch(`/api/busca?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { results: [], categories: [] }))
      .then((data: { results: SearchResultItem[]; categories: string[] }) => {
        setResults(data.results)
        setCategories((prev) => (data.categories.length > 0 ? data.categories : prev))
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== "AbortError") setIsLoading(false)
      })

    return () => controller.abort()
  }, [searchTerm, selectedType, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(inputValue.trim())
    const url = new URL(window.location.href)
    url.searchParams.set("q", inputValue.trim())
    window.history.pushState({}, "", url.toString())
  }

  const categoryOptions = useMemo(() => ["all", ...categories], [categories])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">Buscar Conteúdo</h1>

              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Digite sua busca: eventos, personagens, países, períodos históricos..."
                    className="pl-12 pr-24 py-4 text-lg"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Button type="submit" className="absolute right-2 top-2">
                    Buscar
                  </Button>
                </div>
              </form>

              {searchTerm.length >= 2 && (
                <p className="text-center text-muted-foreground">
                  {isLoading ? "Buscando..." : `${results.length} resultado(s) encontrado(s) para "${searchTerm}"`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        {searchTerm.length >= 2 && (
          <section className="py-6 border-b">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat === "all" ? "Todas as categorias" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search Results */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {searchTerm.length < 2 ? (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center">Sugestões de Busca</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setInputValue(suggestion.term)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{suggestion.term}</CardTitle>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="ghost" size="sm">
                          Buscar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-3 bg-muted rounded w-full mb-2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-6">
                    {results.map((result) => (
                      <Card key={result.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge className={`${TYPE_BADGE_COLORS[result.type]} text-white`}>
                                {TYPE_LABELS[result.type]}
                              </Badge>
                              <Badge variant="secondary">{result.category}</Badge>
                            </div>
                            {result.date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{result.date}</span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-xl hover:text-primary">
                            <Link href={result.url}>{result.title}</Link>
                          </CardTitle>
                          <CardDescription className="text-base line-clamp-3">{result.excerpt}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" asChild>
                            <Link href={result.url}>
                              Ler Mais <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Tente usar termos diferentes ou remover alguns filtros.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputValue("")
                        setSearchTerm("")
                        setSelectedType("all")
                        setSelectedCategory("all")
                      }}
                    >
                      Limpar Busca
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
