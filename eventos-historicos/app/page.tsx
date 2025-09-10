import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SearchWidget } from "@/components/search-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight, Globe, BookOpen, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 to-accent/5 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
                Desvendando os <span className="text-primary">Eventos Históricos</span> que Moldaram o Mundo
              </h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
                Explore a geopolítica mundial, descubra curiosidades fascinantes e compreenda os grandes eventos que
                definiram nossa história através de análises profundas e conteúdo exclusivo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/noticias">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Últimas Notícias
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/linha-do-tempo">
                    <Clock className="mr-2 h-5 w-5" />
                    Linha do Tempo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured News Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Notícias em Destaque</h2>
                <p className="text-muted-foreground">As últimas análises geopolíticas e eventos mundiais</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/noticias">
                  Ver Todas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Featured Article */}
              <Card className="lg:col-span-3 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative">
                    <Image
                      src="/geopolitics-world-map-with-news-overlay.jpg"
                      alt="Tensões no Oriente Médio"
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">Urgente</Badge>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>15 de Janeiro, 2024</span>
                      <Badge variant="secondary">Oriente Médio</Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">
                      Escalada de Tensões no Oriente Médio: Análise das Implicações Geopolíticas
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Uma análise profunda dos recentes desenvolvimentos na região e suas consequências para o
                      equilíbrio de poder mundial, incluindo o papel das grandes potências.
                    </p>
                    <Button asChild>
                      <Link href="/artigo/tensoes-oriente-medio">Ler Análise Completa</Link>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Side Widgets */}
              <div className="space-y-6">
                <SearchWidget />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Artigo Popular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">China e EUA: Nova Fase das Relações Comerciais</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análise dos acordos comerciais recentes e seu impacto na economia global.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/artigo/china-eua-comercio">Leia Mais</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Historical Curiosities Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Curiosidades Históricas</h2>
                <p className="text-muted-foreground">Fatos fascinantes que você talvez não conhecia</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/curiosidades">
                  Ver Todas <ArrowRight className="ml-2 h-4 w-4" />
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
                    <Link href="/curiosidade/biblioteca-alexandria">
                      Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
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
                    O maior império contíguo da história cobria 24 milhões de km² - maior que a África inteira. Conheça
                    os segredos de sua expansão.
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/curiosidade/imperio-mongol">
                      Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
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
                    Na verdade durou 116 anos e não foi uma guerra contínua, mas uma série de conflitos entre Inglaterra
                    e França com longos períodos de paz.
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/curiosidade/guerra-cem-anos">
                      Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Timeline Preview Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Linha do Tempo Interativa</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore os eventos mais importantes da história mundial de forma cronológica e interativa
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Timeline Preview */}
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-border"></div>

                <div className="space-y-12">
                  {/* Timeline Item 1 */}
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

                  {/* Timeline Item 2 */}
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

                  {/* Timeline Item 3 */}
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
                    Explorar Linha do Tempo Completa
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Mantenha-se Informado</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Receba análises exclusivas, curiosidades históricas e as últimas notícias de geopolítica diretamente no
              seu email.
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 px-4 py-3 rounded-lg text-foreground"
              />
              <Button variant="secondary" size="lg">
                Inscrever-se
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
