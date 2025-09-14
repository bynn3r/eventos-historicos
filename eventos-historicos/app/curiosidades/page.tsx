import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import curiosidadesData from "@/data/curiosidades.json"

export default function CuriosidadesPage() {
  const sortedCuriosidades = [...curiosidadesData].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Curiosidades Históricas</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Descubra fatos fascinantes e histórias surpreendentes que você provavelmente não conhecia
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar curiosidades..." className="pl-10" />
            </div>
          </div>
        </section>

        {/* Curiosities Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCuriosidades.map((curiosidade) => (
                <Card key={curiosidade.id} className="hover:shadow-lg transition-shadow">
                  {curiosidade.imagem && (
                    <div className="aspect-video relative">
                      <Image
                        src={
                          curiosidade.imagem ||
                          `/placeholder.svg?height=200&width=400&query=${curiosidade.categoria.toLowerCase()} historical curiosity`
                        }
                        alt={curiosidade.titulo}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{curiosidade.categoria}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(curiosidade.data).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{curiosidade.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {curiosidade.descricao.length > 150
                        ? `${curiosidade.descricao.substring(0, 150)}...`
                        : curiosidade.descricao}
                    </p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/curiosidades/${curiosidade.slug}`}>Leia Mais</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Carregar Mais Curiosidades
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
