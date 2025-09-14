import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Filter, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import noticiasData from "@/data/noticias.json"

export default function NoticiasPage() {
  const sortedNoticias = [...noticiasData].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  const featuredNoticia = sortedNoticias[0]
  const otherNoticias = sortedNoticias.slice(1)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Notícias de Geopolítica</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Análises profundas dos eventos geopolíticos que moldam o cenário mundial atual
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar notícias..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oriente-medio">Oriente Médio</SelectItem>
                    <SelectItem value="economia-global">Economia Global</SelectItem>
                    <SelectItem value="europa">Europa</SelectItem>
                    <SelectItem value="asia">Ásia</SelectItem>
                    <SelectItem value="americas">Américas</SelectItem>
                    <SelectItem value="africa">África</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredNoticia && (
                <Card className="md:col-span-2 lg:col-span-3 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto relative">
                      <Image
                        src={featuredNoticia.imagem || "/placeholder.svg?height=400&width=600&query=geopolitics news"}
                        alt={featuredNoticia.titulo}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                        Destaque
                      </Badge>
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(featuredNoticia.data).toLocaleDateString("pt-BR")}</span>
                        <Badge variant="secondary">{featuredNoticia.categoria}</Badge>
                        {featuredNoticia.autor && (
                          <>
                            <User className="h-4 w-4" />
                            <span>{featuredNoticia.autor}</span>
                          </>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold mb-4">{featuredNoticia.titulo}</h2>
                      <p className="text-muted-foreground mb-6">{featuredNoticia.descricao}</p>
                      <Button asChild>
                        <Link href={`/noticias/${featuredNoticia.slug}`}>Ler Análise Completa</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {otherNoticias.map((noticia) => (
                <Card key={noticia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <Image
                      src={
                        noticia.imagem ||
                        `/placeholder.svg?height=200&width=400&query=${noticia.categoria.toLowerCase()} geopolitics news`
                      }
                      alt={noticia.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(noticia.data).toLocaleDateString("pt-BR")}</span>
                      <Badge variant="secondary">{noticia.categoria}</Badge>
                    </div>
                    <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                    <CardDescription>{noticia.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/noticias/${noticia.slug}`}>Leia Mais</Link>
                      </Button>
                      {noticia.autor && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{noticia.autor}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Carregar Mais Notícias
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
