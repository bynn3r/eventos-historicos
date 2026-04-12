import Image from "next/image"
import Link from "next/link"
import { Calendar, ExternalLink, User } from "lucide-react"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNewsDate, type SiteNewsArticle } from "@/lib/news"

interface NewsPageContentProps {
  rssArticles: SiteNewsArticle[]
  localArticles: SiteNewsArticle[]
}

export function NewsPageContent({ rssArticles, localArticles }: NewsPageContentProps) {
  const featuredNoticia = rssArticles[0] ?? localArticles[0]
  const otherRssNoticias = rssArticles.slice(1, 7)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Notícias de Geopolítica</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Feed curado por RSS para destacar geopolítica, diplomacia, memória histórica e marcos contemporâneos com
              relevância global.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Badge variant="secondary">Atualização automática</Badge>
              <Badge variant="outline">Geopolítica</Badge>
              <Badge variant="outline">Eventos históricos</Badge>
              <Badge variant="outline">Corrida espacial</Badge>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 space-y-10">
            {featuredNoticia && (
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative">
                    <Image src={featuredNoticia.imagem} alt={featuredNoticia.titulo} fill className="object-cover" />
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                      {featuredNoticia.tipo === "rss" ? "Destaque RSS" : "Análise do portal"}
                    </Badge>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>{formatNewsDate(featuredNoticia.data)}</span>
                      <Badge variant="secondary">{featuredNoticia.categoria}</Badge>
                      <span>{featuredNoticia.fonte}</span>
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
                      {featuredNoticia.externo ? (
                        <a href={featuredNoticia.href} target="_blank" rel="noopener noreferrer">
                          <span className="inline-flex items-center gap-2">
                            Abrir cobertura
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        </a>
                      ) : (
                        <Link href={featuredNoticia.href}>Ler análise completa</Link>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {otherRssNoticias.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Cobertura em tempo quase real</h2>
                    <p className="text-muted-foreground">Notícias vindas do RSS e filtradas para o tema do site.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherRssNoticias.map((noticia) => (
                    <Card key={noticia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video relative">
                        <Image src={noticia.imagem} alt={noticia.titulo} fill className="object-cover" />
                      </div>
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatNewsDate(noticia.data)}</span>
                          <Badge variant="secondary">{noticia.categoria}</Badge>
                        </div>
                        <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                        <CardDescription>{noticia.descricao}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-3">
                          <Button variant="outline" size="sm" asChild>
                            <a href={noticia.href} target="_blank" rel="noopener noreferrer">
                              Leia na fonte
                            </a>
                          </Button>
                          <span className="text-xs text-muted-foreground">{noticia.fonte}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Análises do portal</h2>
                  <p className="text-muted-foreground">
                    Conteúdo editorial próprio para complementar o fluxo automático das notícias.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localArticles.map((noticia) => (
                  <Card key={noticia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <Image src={noticia.imagem} alt={noticia.titulo} fill className="object-cover" />
                    </div>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatNewsDate(noticia.data)}</span>
                        <Badge variant="secondary">{noticia.categoria}</Badge>
                      </div>
                      <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                      <CardDescription>{noticia.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={noticia.href}>Leia mais</Link>
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
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
