"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SearchWidget } from "@/components/search-widget"
import { NewsImage } from "@/components/news-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight, Globe, BookOpen, TrendingUp, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { formatNewsDate, hasContextualImage, type SiteNewsArticle } from "@/lib/news"

interface HomePageClientProps {
  featuredNews: SiteNewsArticle[]
}

function NewsCta({ article, children }: { article: SiteNewsArticle; children: React.ReactNode }) {
  return <Link href={article.href}>{children}</Link>
}

export function HomePageClient({ featuredNews }: HomePageClientProps) {
  const { t } = useLanguage()
  const featuredArticle = featuredNews.find(hasContextualImage) ?? featuredNews[0]
  const secondaryArticle = featuredNews.find((article) => article.id !== featuredArticle?.id) ?? featuredArticle

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-primary/5 to-accent/5 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">{t("hero.title")}</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">{t("hero.subtitle")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/noticias">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t("hero.latestNews")}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/linha-do-tempo">
                    <Clock className="mr-2 h-5 w-5" />
                    {t("hero.timeline")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">{t("sections.featuredNews")}</h2>
                <p className="text-muted-foreground">
                  Curadoria automática por RSS com foco em geopolítica, memória histórica e marcos globais.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/noticias">
                  {t("sections.seeAll")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {featuredArticle && (
                <Card className="lg:col-span-3 overflow-hidden self-start">
                  <div className={`grid gap-0 ${hasContextualImage(featuredArticle) ? "md:grid-cols-2" : "grid-cols-1"}`}>
                    {hasContextualImage(featuredArticle) ? (
                      <Link
                        href={featuredArticle.href}
                        className="group relative block min-h-[260px] overflow-hidden md:min-h-full"
                      >
                        <NewsImage
                          src={featuredArticle.imagem}
                          alt={featuredArticle.titulo}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                          Destaque RSS
                        </Badge>
                      </Link>
                    ) : (
                      <div className="hidden md:block bg-muted/40" />
                    )}
                    <div className="p-6 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatNewsDate(featuredArticle.data)}</span>
                        <Badge variant="secondary">{featuredArticle.categoria}</Badge>
                        <span>{featuredArticle.fonte}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">
                        <NewsCta article={featuredArticle}>
                          <span className="hover:text-primary transition-colors">{featuredArticle.titulo}</span>
                        </NewsCta>
                      </h3>
                      <p className="text-muted-foreground mb-6">{featuredArticle.descricao}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button asChild>
                          <NewsCta article={featuredArticle}>
                            <span className="inline-flex items-center gap-2">Ler no site</span>
                          </NewsCta>
                        </Button>
                        {featuredArticle.linkFonte && (
                          <a
                            href={featuredArticle.linkFonte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            Fonte original
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

                <div className="space-y-6">
                <SearchWidget />

                {secondaryArticle && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Radar da semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="mb-3">
                        {secondaryArticle.categoria}
                      </Badge>
                      <h4 className="font-semibold mb-2">
                        <NewsCta article={secondaryArticle}>
                          <span className="hover:text-primary transition-colors">{secondaryArticle.titulo}</span>
                        </NewsCta>
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">{secondaryArticle.descricao}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                          <NewsCta article={secondaryArticle}>
                            <span className="inline-flex items-center gap-2">Ler no site</span>
                          </NewsCta>
                        </Button>
                        {secondaryArticle.linkFonte && (
                          <a
                            href={secondaryArticle.linkFonte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Fonte
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">{t("sections.historicalCuriosities")}</h2>
                <p className="text-muted-foreground">{t("sections.historicalCuriositiesSubtitle")}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/curiosidades">
                  {t("sections.seeAll")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl">A Biblioteca de Alexandria</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Descoberta recente revela que a famosa biblioteca não foi destruída em um único evento, mas declinou
                    gradualmente ao longo de séculos.
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/curiosidades/biblioteca-de-alexandria">
                      {t("common.readMore")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl">O Império Mongol</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    O maior império contíguo da história cobria 24 milhões de km². Conheça os segredos políticos e
                    militares de sua expansão.
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/curiosidades/imperio-mongol">
                      {t("common.readMore")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl">A Guerra dos Cem Anos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Na verdade durou 116 anos e alternou conflito e trégua, moldando a formação política de Inglaterra e
                    França.
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/curiosidades/guerra-cem-anos">
                      {t("common.readMore")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t("sections.majorEvents")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("sections.majorEventsSubtitle")}</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-border"></div>

                <div className="space-y-12">
                  <div className="relative flex items-center">
                    <div className="flex-1 pr-8 text-right">
                      <Card className="inline-block max-w-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">1945</CardTitle>
                          <CardDescription>Fim da Segunda Guerra Mundial</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            O fim do conflito mais devastador da história marca o início de uma nova ordem mundial.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                    <div className="flex-1 pl-8"></div>
                  </div>

                  <div className="relative flex items-center">
                    <div className="flex-1 pr-8"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-accent rounded-full border-4 border-background"></div>
                    <div className="flex-1 pl-8">
                      <Card className="inline-block max-w-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">1961</CardTitle>
                          <CardDescription>Construção do Muro de Berlim</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Símbolo da divisão do mundo durante a Guerra Fria entre capitalismo e socialismo.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <div className="flex-1 pr-8 text-right">
                      <Card className="inline-block max-w-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">1989</CardTitle>
                          <CardDescription>Queda do Muro de Berlim</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">O fim simbólico da Guerra Fria e o início da reunificação alemã.</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                    <div className="flex-1 pl-8"></div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button size="lg" asChild>
                  <Link href="/linha-do-tempo">
                    <Clock className="mr-2 h-5 w-5" />
                    {t("hero.timeline")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary-foreground">{t("newsletter.title")}</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{t("newsletter.subtitle")}</p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1 px-4 py-3 rounded-lg text-foreground"
              />
              <Button variant="secondary" size="lg">
                {t("newsletter.subscribe")}
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-4">Sem spam. Cancele a qualquer momento.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
