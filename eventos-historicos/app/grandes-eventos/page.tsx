import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, Globe, Zap, Sword } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Grandes Eventos da História | Eventos Históricos",
  description:
    "Explore os acontecimentos que definiram a humanidade: guerras, revoluções, descobertas e momentos que mudaram o curso da história.",
  alternates: {
    canonical: "https://eventoshistoricos.com.br/grandes-eventos",
  },
  openGraph: {
    title: "Grandes Eventos da História | Eventos Históricos",
    description: "Os acontecimentos que definiram a humanidade: guerras, revoluções e descobertas.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/grandes-eventos",
  },
}

export default function GrandesEventosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Grandes Eventos da História</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Os momentos decisivos que moldaram o curso da humanidade e definiram nossa civilização
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar eventos históricos..." className="pl-10" />
            </div>
          </div>
        </section>

        {/* Events Timeline */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="space-y-8">
              {[
                {
                  year: "1945",
                  title: "Fim da Segunda Guerra Mundial",
                  slug: "fim-segunda-guerra-mundial",
                  description:
                    "O conflito mais devastador da história chega ao fim com a rendição do Japão, marcando o início de uma nova ordem mundial e o surgimento das superpotências.",
                  impact: "Redefiniu o mapa geopolítico mundial",
                  casualties: "70-85 milhões de mortos",
                  icon: Globe,
                  image: "/eventos/hero-reichstag.jpg",
                },
                {
                  year: "1969",
                  title: "Chegada do Homem à Lua",
                  slug: "chegada-homem-lua",
                  description:
                    "Neil Armstrong e Buzz Aldrin se tornam os primeiros humanos a pisar na Lua, representando o ápice da corrida espacial e um marco na exploração espacial.",
                  impact: "Revolução tecnológica e científica",
                  casualties: "Marco pacífico da humanidade",
                  icon: Zap,
                  image: "/eventos/hero-apollo11-aldrin.jpg",
                },
                {
                  year: "1989",
                  title: "Queda do Muro de Berlim",
                  slug: "queda-muro-berlim",
                  description:
                    "A derrubada do muro simboliza o fim da Guerra Fria e a reunificação da Alemanha, marcando uma nova era nas relações internacionais.",
                  impact: "Fim da divisão ideológica mundial",
                  casualties: "Fim pacífico de um conflito de décadas",
                  icon: Users,
                  image: "/eventos/hero-muro-berlim.jpg",
                },
                {
                  year: "1453",
                  title: "Queda de Constantinopla",
                  slug: "queda-constantinopla",
                  description:
                    "A conquista otomana marca o fim do Império Bizantino e altera drasticamente o equilíbrio de poder entre Europa e Ásia, impulsionando as Grandes Navegações.",
                  impact: "Mudança nas rotas comerciais mundiais",
                  casualties: "Fim de um império milenar",
                  icon: Globe,
                  image: "/eventos/hero-constantinopla.jpg",
                },
                {
                  year: "1492",
                  title: "Chegada de Colombo às Américas",
                  slug: "descobrimento-america",
                  description:
                    "Em outubro de 1492, três navios espanhóis ancoraram numa ilha do Caribe que os europeus desconheciam — inaugurando um contato entre dois mundos que transformaria, e devastaria, povos de dois continentes.",
                  impact: "Intercâmbio Colombiano: plantas, doenças, povos e culturas",
                  casualties: "Colapso demográfico indígena estimado em 80–90%",
                  icon: Globe,
                  image: "/eventos/hero-colombo.jpg",
                },
                {
                  year: "1789",
                  title: "Revolução Francesa",
                  slug: "revolucao-francesa",
                  description:
                    "Uma monarquia à beira da falência e um povo faminto: em poucas semanas, os Estados Gerais viraram Assembleia Nacional, a Bastilha caiu e o Antigo Regime começou a desmoronar.",
                  impact: "Fim do Antigo Regime e ascensão do ideal republicano",
                  casualties: "≈ 17.000 executados durante o Terror (1793–94)",
                  icon: Users,
                  image: "/eventos/hero-bastilha.jpg",
                },
                {
                  year: "1822",
                  title: "Independência do Brasil",
                  slug: "independencia-brasil",
                  description:
                    "Às margens do riacho do Ipiranga, Dom Pedro I rompe com Portugal e transforma a maior colônia das Américas no primeiro império independente do continente.",
                  impact: "Nascimento da nação brasileira",
                  casualties: "Rompimento negociado ao longo de 3 anos",
                  icon: Globe,
                  image: "/eventos/hero-independencia-brasil.jpg",
                },
                {
                  year: "1914",
                  title: "Primeira Guerra Mundial",
                  slug: "primeira-guerra-mundial",
                  description:
                    "Um assassinato em Sarajevo arrasta impérios inteiros para quatro anos de trincheiras, redesenhando o mapa da Europa e lançando as sementes do conflito seguinte.",
                  impact: "Fim de quatro impérios europeus",
                  casualties: "Cerca de 17 milhões de mortos",
                  icon: Sword,
                  image: "/eventos/hero-primeira-guerra-mundial.jpg",
                },
                {
                  year: "1917",
                  title: "Revolução Russa",
                  slug: "revolucao-russa",
                  description:
                    "Em oito meses, operárias famintas em Petrogrado desencadeiam a queda de um império de 300 anos e a ascensão do primeiro Estado socialista da história.",
                  impact: "Nascimento da União Soviética",
                  casualties: "Guerra civil e milhões de vítimas",
                  icon: Users,
                  image: "/eventos/hero-revolucao-russa.jpg",
                },
              ].map((event, index) => {
                const IconComponent = event.icon
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="aspect-video md:aspect-auto relative">
                        <Image
                          src={
                            event.image.startsWith("/") && !event.image.includes("?")
                              ? event.image
                              : `/abstract-geometric-shapes.png?height=300&width=400&query=${event.image}`
                          }
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary text-primary-foreground text-lg font-bold px-3 py-1">
                            {event.year}
                          </Badge>
                        </div>
                      </div>
                      <div className="md:col-span-2 p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <CardHeader className="p-0 mb-4">
                              <CardTitle className="text-2xl">{event.title}</CardTitle>
                              <CardDescription className="text-base">{event.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">IMPACTO</h4>
                                  <p className="text-sm">{event.impact}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">CONSEQUÊNCIAS</h4>
                                  <p className="text-sm">{event.casualties}</p>
                                </div>
                              </div>
                              <Button asChild>
                                <Link href={`/evento/${event.slug}`}>Explorar Evento Completo</Link>
                              </Button>
                            </CardContent>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Carregar Mais Eventos
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
