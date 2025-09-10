"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface SearchResult {
  id: string
  title: string
  excerpt: string
  type: "noticia" | "curiosidade" | "evento" | "artigo"
  category: string
  date: string
  url: string
}

const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "Escalada de Tensões no Oriente Médio: Análise das Implicações Geopolíticas",
    excerpt:
      "Uma análise profunda dos recentes desenvolvimentos na região e suas consequências para o equilíbrio de poder mundial...",
    type: "noticia",
    category: "Oriente Médio",
    date: "15 de Janeiro, 2024",
    url: "/artigo/tensoes-oriente-medio",
  },
  {
    id: "2",
    title: "A Biblioteca de Alexandria Nunca Foi Totalmente Destruída",
    excerpt:
      "Contrário à crença popular, a famosa Biblioteca de Alexandria não foi destruída em um único evento catastrófico...",
    type: "curiosidade",
    category: "Antiguidade",
    date: "10 de Janeiro, 2024",
    url: "/curiosidade/biblioteca-alexandria",
  },
  {
    id: "3",
    title: "Fim da Segunda Guerra Mundial",
    excerpt:
      "O conflito mais devastador da história chega ao fim com a rendição do Japão, marcando o início de uma nova ordem mundial...",
    type: "evento",
    category: "Século XX",
    date: "5 de Janeiro, 2024",
    url: "/evento/1945-fim-segunda-guerra-mundial",
  },
  {
    id: "4",
    title: "China e EUA: Nova Fase das Relações Comerciais",
    excerpt: "Análise dos acordos comerciais recentes e seu impacto na economia global...",
    type: "noticia",
    category: "Ásia",
    date: "14 de Janeiro, 2024",
    url: "/artigo/china-eua-comercio",
  },
  {
    id: "5",
    title: "O Império Mongol Era Maior que a África",
    excerpt:
      "O Império Mongol, no seu auge, cobria aproximadamente 24 milhões de km² - maior que todo o continente africano...",
    type: "curiosidade",
    category: "Idade Média",
    date: "8 de Janeiro, 2024",
    url: "/curiosidade/imperio-mongol",
  },
]

export default function BuscaPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const contentTypes = ["all", "noticia", "curiosidade", "evento", "artigo"]
  const categories = [
    "all",
    "Oriente Médio",
    "Ásia",
    "Europa",
    "Américas",
    "África",
    "Antiguidade",
    "Idade Média",
    "Século XX",
  ]

  const getTypeLabel = (type: string) => {
    const labels = {
      all: "Todos",
      noticia: "Notícias",
      curiosidade: "Curiosidades",
      evento: "Eventos",
      artigo: "Artigos",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      noticia: "bg-blue-500",
      curiosidade: "bg-green-500",
      evento: "bg-purple-500",
      artigo: "bg-orange-500",
    }
    return colors[type as keyof typeof colors] || "bg-gray-500"
  }

  useEffect(() => {
    if (searchTerm) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        const filtered = mockSearchResults.filter((result) => {
          const matchesSearch =
            result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            result.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesType = selectedType === "all" || result.type === selectedType
          const matchesCategory = selectedCategory === "all" || result.category === selectedCategory

          return matchesSearch && matchesType && matchesCategory
        })
        setResults(filtered)
        setIsLoading(false)
      }, 500)
    } else {
      setResults([])
    }
  }, [searchTerm, selectedType, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Update URL with search params
    const url = new URL(window.location.href)
    url.searchParams.set("q", searchTerm)
    window.history.pushState({}, "", url.toString())
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">Buscar Conteúdo</h1>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Digite sua busca: eventos, países, períodos históricos..."
                    className="pl-12 pr-4 py-4 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" className="absolute right-2 top-2">
                    Buscar
                  </Button>
                </div>
              </form>

              {searchTerm && (
                <p className="text-center text-muted-foreground">
                  {isLoading ? "Buscando..." : `${results.length} resultado(s) encontrado(s) para "${searchTerm}"`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        {searchTerm && (
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
                      {contentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "Todas" : category}
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
            {!searchTerm ? (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center">Sugestões de Busca</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { term: "Segunda Guerra Mundial", description: "Eventos e análises do maior conflito da história" },
                    { term: "Império Romano", description: "História e curiosidades sobre Roma Antiga" },
                    { term: "Guerra Fria", description: "Tensões entre EUA e URSS no século XX" },
                    { term: "Revolução Francesa", description: "O movimento que mudou a França e o mundo" },
                    { term: "Descobrimento da América", description: "As grandes navegações e seus impactos" },
                    { term: "Oriente Médio", description: "Geopolítica e conflitos na região" },
                  ].map((suggestion, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSearchTerm(suggestion.term)}
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
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getTypeBadgeColor(result.type)} text-white`}>
                                {getTypeLabel(result.type)}
                              </Badge>
                              <Badge variant="secondary">{result.category}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{result.date}</span>
                            </div>
                          </div>
                          <CardTitle className="text-xl hover:text-primary">
                            <Link href={result.url}>{result.title}</Link>
                          </CardTitle>
                          <CardDescription className="text-base">{result.excerpt}</CardDescription>
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
