import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, Globe, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
                  description:
                    "O conflito mais devastador da história chega ao fim com a rendição do Japão, marcando o início de uma nova ordem mundial e o surgimento das superpotências.",
                  impact: "Redefiniu o mapa geopolítico mundial",
                  casualties: "70-85 milhões de mortos",
                  icon: Globe,
                  image: "world war 2 end celebration",
                },
                {
                  year: "1969",
                  title: "Chegada do Homem à Lua",
                  description:
                    "Neil Armstrong e Buzz Aldrin se tornam os primeiros humanos a pisar na Lua, representando o ápice da corrida espacial e um marco na exploração espacial.",
                  impact: "Revolução tecnológica e científica",
                  casualties: "Marco pacífico da humanidade",
                  icon: Zap,
                  image: "moon landing apollo 11",
                },
                {
                  year: "1989",
                  title: "Queda do Muro de Berlim",
                  description:
                    "A derrubada do muro simboliza o fim da Guerra Fria e a reunificação da Alemanha, marcando uma nova era nas relações internacionais.",
                  impact: "Fim da divisão ideológica mundial",
                  casualties: "Fim pacífico de um conflito de décadas",
                  icon: Users,
                  image: "berlin wall fall celebration",
                },
                {
                  year: "1453",
                  title: "Queda de Constantinopla",
                  description:
                    "A conquista otomana marca o fim do Império Bizantino e altera drasticamente o equilíbrio de poder entre Europa e Ásia, impulsionando as Grandes Navegações.",
                  impact: "Mudança nas rotas comerciais mundiais",
                  casualties: "Fim de um império milenar",
                  icon: Globe,
                  image: "constantinople ottoman conquest",
                },
                {
                  year: "1492",
                  title: "Descobrimento da América",
                  description:
                    "A chegada de Cristóvão Colombo às Américas inicia a era dos descobrimentos e conecta definitivamente os continentes, transformando a história mundial.",
                  impact: "Integração global dos continentes",
                  casualties: "Transformação demográfica mundial",
                  icon: Globe,
                  image: "columbus america discovery",
                },
                {
                  year: "1789",
                  title: "Revolução Francesa",
                  description:
                    "O movimento revolucionário que derrubou o Antigo Regime francês espalha ideais de liberdade, igualdade e fraternidade por todo o mundo.",
                  impact: "Nascimento da democracia moderna",
                  casualties: "Milhares de mortos durante o Terror",
                  icon: Users,
                  image: "french revolution storming bastille",
                },
              ].map((event, index) => {
                const IconComponent = event.icon
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="aspect-video md:aspect-auto relative">
                        <Image
                          src={`/abstract-geometric-shapes.png?height=300&width=400&query=${event.image}`}
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
                                <Link
                                  href={`/evento/${event.year.toLowerCase()}-${event.title.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                  Explorar Evento Completo
                                </Link>
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
