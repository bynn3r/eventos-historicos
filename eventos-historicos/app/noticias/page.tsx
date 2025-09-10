import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function NoticiasPage() {
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
                    <SelectItem value="asia">Ásia</SelectItem>
                    <SelectItem value="europa">Europa</SelectItem>
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
              {/* Featured Article */}
              <Card className="md:col-span-2 lg:col-span-3 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative">
                    <Image src="/world-map-with-geopolitical-tensions.jpg" alt="Análise Geopolítica" fill className="object-cover" />
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">Destaque</Badge>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>16 de Janeiro, 2024</span>
                      <Badge variant="secondary">Análise</Badge>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">
                      O Novo Equilíbrio de Poder Global: Implicações para 2024
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Uma análise abrangente das mudanças geopolíticas recentes e como elas podem redefinir as relações
                      internacionais nos próximos anos, incluindo o papel emergente de novas potências regionais.
                    </p>
                    <Button asChild>
                      <Link href="/artigo/equilibrio-poder-global-2024">Ler Análise Completa</Link>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Regular Articles */}
              {[
                {
                  title: "Tensões no Mar do Sul da China: Análise Estratégica",
                  excerpt:
                    "Examinamos as recentes movimentações militares na região e suas implicações para o comércio global.",
                  date: "15 de Janeiro, 2024",
                  category: "Ásia",
                  slug: "tensoes-mar-sul-china",
                },
                {
                  title: "União Europeia e a Crise Energética: Novos Desenvolvimentos",
                  excerpt: "Como os países europeus estão se adaptando às mudanças no fornecimento de energia.",
                  date: "14 de Janeiro, 2024",
                  category: "Europa",
                  slug: "ue-crise-energetica",
                },
                {
                  title: "África: O Continente em Ascensão Geopolítica",
                  excerpt: "Análise do crescente papel da África nas relações internacionais e economia global.",
                  date: "13 de Janeiro, 2024",
                  category: "África",
                  slug: "africa-ascensao-geopolitica",
                },
                {
                  title: "América Latina: Integração Regional em Foco",
                  excerpt: "Os desafios e oportunidades da integração econômica e política na região.",
                  date: "12 de Janeiro, 2024",
                  category: "Américas",
                  slug: "america-latina-integracao",
                },
                {
                  title: "Oriente Médio: Diplomacia e Conflitos Regionais",
                  excerpt: "Uma visão atualizada dos principais conflitos e iniciativas diplomáticas na região.",
                  date: "11 de Janeiro, 2024",
                  category: "Oriente Médio",
                  slug: "oriente-medio-diplomacia",
                },
              ].map((article, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <Image
                      src={`/abstract-geometric-shapes.png?height=200&width=400&query=${article.category.toLowerCase()} geopolitics news`}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{article.date}</span>
                      <Badge variant="secondary">{article.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <CardDescription>{article.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/artigo/${article.slug}`}>Leia Mais</Link>
                    </Button>
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
