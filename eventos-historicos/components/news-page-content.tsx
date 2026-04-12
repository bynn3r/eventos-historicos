import Link from "next/link"
import { Calendar, ExternalLink, User } from "lucide-react"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { NewsImage } from "@/components/news-image"
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
  const otherRssNoticias = rssArticles.slice(1, 10)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Notícias de Geopolítica</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Agregador em tempo real com feeds internacionais e brasileiros, filtrado para geopolítica, história e
              eventos de alto impacto global.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Badge variant="secondary">Atualização automática</Badge>
              <Badge variant="outline">Exploração Espacial</Badge>
              <Badge variant="outline">Conflitos</Badge>
              <Badge variant="outline">Política</Badge>
              <Badge variant="outline">Economia Global</Badge>
              <Badge variant="outline">História</Badge>
              <Badge variant="outline">Geopolítica</Badge>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 space-y-10">
            {featuredNoticia && (
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative">
                    <NewsImage src={featuredNoticia.imagem} alt={featuredNoticia.titulo} fill className="object-cover" />
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
                    <div className="flex flex-wrap items-center gap-3">
                      <Button asChild>
                        <Link href={featuredNoticia.href}>Ler no Eventos Históricos</Link>
                      </Button>
                      {featuredNoticia.linkFonte && (
                        <a
                          href={featuredNoticia.linkFonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          Ver fonte oficial
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {otherRssNoticias.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Cobertura em tempo quase real</h2>
                    <p className="text-muted-foreground">
                      Itens mais recentes vindos de BBC, Al Jazeera, Guardian, G1, UOL, Agência Brasil e fontes abertas
                      de história, priorizados por peso geopolítico.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {otherRssNoticias.map((noticia) => (
                    <Card key={noticia.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                      <div className="aspect-video relative">
                        <NewsImage src={noticia.imagem} alt={noticia.titulo} fill className="object-cover" />
                      </div>
                      <CardHeader className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatNewsDate(noticia.data)}</span>
                          <Badge variant="secondary">{noticia.categoria}</Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight min-h-[4.5rem]">
                          <Link href={noticia.href} className="hover:text-primary transition-colors">
                            {noticia.titulo}
                          </Link>
                        </CardTitle>
                        <CardDescription className="min-h-[6.5rem] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                          {noticia.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="flex items-center justify-between gap-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={noticia.href}>Ler no site</Link>
                          </Button>
                          {noticia.linkFonte ? (
                            <a
                              href={noticia.linkFonte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {noticia.fonte}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{noticia.fonte}</span>
                          )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {localArticles.map((noticia) => (
                  <Card key={noticia.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="aspect-video relative">
                      <NewsImage src={noticia.imagem} alt={noticia.titulo} fill className="object-cover" />
                    </div>
                    <CardHeader className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatNewsDate(noticia.data)}</span>
                        <Badge variant="secondary">{noticia.categoria}</Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight min-h-[4.5rem]">{noticia.titulo}</CardTitle>
                      <CardDescription className="min-h-[6.5rem] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                        {noticia.descricao}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
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
