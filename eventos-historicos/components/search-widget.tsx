"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, TrendingUp } from "lucide-react"

export function SearchWidget() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const trendingSearches = ["Segunda Guerra Mundial", "Império Romano", "Guerra Fria", "Revolução Francesa"]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Rápida
        </CardTitle>
        <CardDescription>Encontre artigos, eventos e curiosidades históricas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Digite sua busca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Buscas Populares
          </h4>
          <div className="flex flex-wrap gap-1">
            {trendingSearches.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-transparent"
                onClick={() => router.push(`/busca?q=${encodeURIComponent(term)}`)}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
