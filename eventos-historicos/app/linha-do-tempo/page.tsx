"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Filter, MapPin, Users, Zap, Globe, Crown, Sword, BookOpen } from "lucide-react"

interface TimelineEvent {
  id: string
  year: number
  title: string
  shortDescription: string
  fullDescription: string
  category: string
  region: string
  impact: string
  icon: any
  color: string
}

const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    year: -3100,
    title: "Unificação do Egito",
    shortDescription: "Menes une o Alto e Baixo Egito, fundando a primeira dinastia.",
    fullDescription:
      "O faraó Menes (também conhecido como Narmer) consegue unificar o Alto e Baixo Egito, estabelecendo a primeira dinastia e criando um dos primeiros estados centralizados da história. Este evento marca o início da civilização egípcia como a conhecemos, com a criação de um sistema administrativo complexo e o desenvolvimento da escrita hieroglífica.",
    category: "Política",
    region: "África",
    impact: "Fundação de uma das civilizações mais duradouras da história",
    icon: Crown,
    color: "bg-yellow-500",
  },
  {
    id: "2",
    year: -776,
    title: "Primeiros Jogos Olímpicos",
    shortDescription: "Início dos Jogos Olímpicos na Grécia Antiga.",
    fullDescription:
      "Os primeiros Jogos Olímpicos registrados são realizados em Olímpia, na Grécia, em honra a Zeus. Este evento marca não apenas o início de uma tradição esportiva que perdura até hoje, mas também representa a importância da competição atlética na cultura grega e o desenvolvimento de um calendário pan-helênico que unia as cidades-estado gregas.",
    category: "Cultural",
    region: "Europa",
    impact: "Criação de uma tradição esportiva mundial",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: "3",
    year: -753,
    title: "Fundação de Roma",
    shortDescription: "História da fundação de Roma por Rômulo e Remo.",
    fullDescription:
      "Segundo a tradição romana, Roma é fundada por Rômulo após matar seu irmão gêmeo Remo. Embora seja uma lenda, esta data marca simbolicamente o início de uma das civilizações mais influentes da história, que evoluiria de uma pequena cidade-estado para um império que dominaria o Mediterrâneo por mais de mil anos.",
    category: "Política",
    region: "Europa",
    impact: "Início do que se tornaria o Império Romano",
    icon: Sword,
    color: "bg-red-500",
  },
  {
    id: "4",
    year: -221,
    title: "Unificação da China",
    shortDescription: "Qin Shi Huang une a China e se torna o primeiro imperador.",
    fullDescription:
      "Qin Shi Huang completa a unificação da China, terminando o período dos Reinos Combatentes e estabelecendo a dinastia Qin. Ele padroniza a moeda, a escrita, as medidas e inicia a construção da Grande Muralha. Suas reformas criam a base para a China imperial que duraria mais de 2000 anos.",
    category: "Política",
    region: "Ásia",
    impact: "Criação da China unificada e imperial",
    icon: Crown,
    color: "bg-yellow-500",
  },
  {
    id: "5",
    year: 476,
    title: "Queda do Império Romano do Ocidente",
    shortDescription: "Fim oficial do Império Romano do Ocidente.",
    fullDescription:
      "Odoacro, líder dos hérulos, depõe Rômulo Augusto, o último imperador romano do Ocidente, marcando o fim oficial do Império Romano do Ocidente. Este evento simboliza o fim da Antiguidade e o início da Idade Média na Europa, com profundas transformações políticas, sociais e culturais.",
    category: "Política",
    region: "Europa",
    impact: "Fim da Antiguidade e início da Idade Média",
    icon: Sword,
    color: "bg-red-500",
  },
  {
    id: "6",
    year: 1453,
    title: "Queda de Constantinopla",
    shortDescription: "Os otomanos conquistam Constantinopla, fim do Império Bizantino.",
    fullDescription:
      "Mehmed II, sultão otomano, conquista Constantinopla após um cerco de 53 dias, pondo fim ao Império Bizantino que durava mais de mil anos. A queda da cidade força muitos eruditos bizantinos a fugir para o Ocidente, contribuindo para o Renascimento, e altera as rotas comerciais, impulsionando as Grandes Navegações.",
    category: "Militar",
    region: "Europa/Ásia",
    impact: "Fim do Império Bizantino e impulso às Grandes Navegações",
    icon: Sword,
    color: "bg-red-500",
  },
  {
    id: "7",
    year: 1492,
    title: "Descobrimento da América",
    shortDescription: "Cristóvão Colombo chega às Américas.",
    fullDescription:
      "Cristóvão Colombo, navegando sob a bandeira espanhola, chega às ilhas do Caribe, iniciando o contato permanente entre a Europa e as Américas. Este evento marca o início da era colonial, com profundas consequências para os povos nativos americanos e o estabelecimento de um sistema econômico global.",
    category: "Exploração",
    region: "Américas",
    impact: "Início da colonização europeia das Américas",
    icon: Globe,
    color: "bg-green-500",
  },
  {
    id: "8",
    year: 1789,
    title: "Revolução Francesa",
    shortDescription: "Início da Revolução Francesa com a Tomada da Bastilha.",
    fullDescription:
      "A Revolução Francesa começa com a Tomada da Bastilha em 14 de julho, marcando o fim do Antigo Regime na França. Os ideais de liberdade, igualdade e fraternidade se espalham pela Europa e pelo mundo, influenciando movimentos democráticos e de independência por séculos.",
    category: "Revolução",
    region: "Europa",
    impact: "Nascimento dos ideais democráticos modernos",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: "9",
    year: 1945,
    title: "Fim da Segunda Guerra Mundial",
    shortDescription: "Rendição do Japão marca o fim da Segunda Guerra Mundial.",
    fullDescription:
      "Com a rendição do Japão em 2 de setembro de 1945, após os bombardeios atômicos de Hiroshima e Nagasaki, termina a Segunda Guerra Mundial. O conflito mais devastador da história deixa entre 70-85 milhões de mortos e redefine completamente o mapa geopolítico mundial, dando início à Guerra Fria.",
    category: "Militar",
    region: "Global",
    impact: "Redefinição da ordem mundial e início da era nuclear",
    icon: Sword,
    color: "bg-red-500",
  },
  {
    id: "10",
    year: 1969,
    title: "Chegada do Homem à Lua",
    shortDescription: "Neil Armstrong e Buzz Aldrin pisam na Lua.",
    fullDescription:
      "A missão Apollo 11 da NASA consegue pousar na Lua, com Neil Armstrong se tornando o primeiro ser humano a pisar em outro corpo celeste. Este feito representa o ápice da corrida espacial e demonstra o potencial da cooperação científica e tecnológica humana.",
    category: "Ciência",
    region: "Global",
    impact: "Marco na exploração espacial e desenvolvimento tecnológico",
    icon: Zap,
    color: "bg-purple-500",
  },
  {
    id: "11",
    year: 1989,
    title: "Queda do Muro de Berlim",
    shortDescription: "Derrubada do Muro de Berlim simboliza o fim da Guerra Fria.",
    fullDescription:
      "A queda do Muro de Berlim em 9 de novembro marca simbolicamente o fim da Guerra Fria e da divisão ideológica do mundo. Este evento leva à reunificação alemã e ao colapso da União Soviética, redefinindo as relações internacionais e iniciando uma nova era de globalização.",
    category: "Política",
    region: "Europa",
    impact: "Fim da Guerra Fria e início da nova ordem mundial",
    icon: Users,
    color: "bg-blue-500",
  },
]

export default function LinhaDoTempoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)

  const categories = ["all", "Política", "Militar", "Cultural", "Revolução", "Exploração", "Ciência"]
  const regions = ["all", "Europa", "Ásia", "África", "Américas", "Global", "Europa/Ásia"]

  const filteredEvents = timelineEvents.filter((event) => {
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
    const matchesRegion = selectedRegion === "all" || event.region === selectedRegion
    const matchesSearch =
      searchTerm === "" ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesRegion && matchesSearch
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Linha do Tempo Interativa</h1>
              <p className="text-xl text-muted-foreground">
                Explore os eventos mais importantes da história mundial de forma cronológica e interativa
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b bg-background sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "Todas" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[150px]">
                    <MapPin className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Região" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region === "all" ? "Todas" : region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="relative max-w-6xl mx-auto">
              {/* Timeline Line - Hidden on mobile, visible on desktop */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary/20 via-primary to-primary/20"></div>

              {/* Mobile Timeline Line - Visible only on mobile */}
              <div className="md:hidden absolute left-8 top-0 w-1 h-full bg-gradient-to-b from-primary/20 via-primary/20 to-primary/20"></div>

              <div className="space-y-8 md:space-y-16">
                {filteredEvents.map((event, index) => {
                  const IconComponent = event.icon
                  const isLeft = index % 2 === 0

                  return (
                    <div key={event.id} className="relative">
                      {/* Mobile Layout */}
                      <div className="md:hidden flex items-start gap-6">
                        {/* Timeline Point */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-8 h-8 ${event.color} rounded-full border-4 border-background flex items-center justify-center shadow-lg`}
                          >
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                        </div>

                        {/* Event Card */}
                        <div className="flex-1 pb-8">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className={`${event.color} text-white font-semibold`}>
                                      {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                    </Badge>
                                    <Badge variant="secondary">{event.category}</Badge>
                                  </div>
                                  <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
                                  <CardDescription className="text-base leading-relaxed">
                                    {event.shortDescription}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.region}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <div className="flex items-center gap-4 mb-4">
                                  <div
                                    className={`w-12 h-12 ${event.color} rounded-lg flex items-center justify-center shadow-lg`}
                                  >
                                    <IconComponent className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={`${event.color} text-white`}>
                                        {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                      </Badge>
                                      <Badge variant="secondary">{event.category}</Badge>
                                      <Badge variant="outline">{event.region}</Badge>
                                    </div>
                                  </div>
                                </div>
                              </DialogHeader>
                              <DialogDescription className="text-base leading-relaxed">
                                {event.fullDescription}
                              </DialogDescription>
                              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">Impacto Histórico:</h4>
                                <p className="text-sm text-muted-foreground">{event.impact}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="flex items-center">
                          {/* Left Side Content */}
                          <div className="flex-1 pr-8">
                            {isLeft && (
                              <div className="text-right">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Card className="inline-block max-w-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ml-auto">
                                      <CardHeader className="pb-3">
                                        <div className="flex items-center justify-end gap-2 mb-3">
                                          <Badge variant="secondary">{event.category}</Badge>
                                          <Badge className={`${event.color} text-white font-semibold`}>
                                            {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                          </Badge>
                                        </div>
                                        <CardTitle className="text-xl leading-tight text-right">
                                          {event.title}
                                        </CardTitle>
                                        <CardDescription className="text-base leading-relaxed text-right">
                                          {event.shortDescription}
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                          <span>{event.region}</span>
                                          <MapPin className="h-4 w-4" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <div className="flex items-center gap-4 mb-4">
                                        <div
                                          className={`w-12 h-12 ${event.color} rounded-lg flex items-center justify-center shadow-lg`}
                                        >
                                          <IconComponent className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                                          <div className="flex items-center gap-2 mt-2">
                                            <Badge className={`${event.color} text-white`}>
                                              {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                            </Badge>
                                            <Badge variant="secondary">{event.category}</Badge>
                                            <Badge variant="outline">{event.region}</Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogHeader>
                                    <DialogDescription className="text-base leading-relaxed">
                                      {event.fullDescription}
                                    </DialogDescription>
                                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                      <h4 className="font-semibold mb-2">Impacto Histórico:</h4>
                                      <p className="text-sm text-muted-foreground">{event.impact}</p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>

                          {/* Center Timeline Point */}
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-10 h-10 ${event.color} rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10 relative`}
                            >
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                          </div>

                          {/* Right Side Content */}
                          <div className="flex-1 pl-8">
                            {!isLeft && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Card className="inline-block max-w-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge className={`${event.color} text-white font-semibold`}>
                                          {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                        </Badge>
                                        <Badge variant="secondary">{event.category}</Badge>
                                      </div>
                                      <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
                                      <CardDescription className="text-base leading-relaxed">
                                        {event.shortDescription}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{event.region}</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                      <div
                                        className={`w-12 h-12 ${event.color} rounded-lg flex items-center justify-center shadow-lg`}
                                      >
                                        <IconComponent className="h-6 w-6 text-white" />
                                      </div>
                                      <div>
                                        <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge className={`${event.color} text-white`}>
                                            {event.year < 0 ? `${Math.abs(event.year)} a.C.` : event.year}
                                          </Badge>
                                          <Badge variant="secondary">{event.category}</Badge>
                                          <Badge variant="outline">{event.region}</Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogHeader>
                                  <DialogDescription className="text-base leading-relaxed">
                                    {event.fullDescription}
                                  </DialogDescription>
                                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold mb-2">Impacto Histórico:</h4>
                                    <p className="text-sm text-muted-foreground">{event.impact}</p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou termo de busca para encontrar eventos históricos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Explore a História</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nossa linha do tempo cobre mais de 5000 anos de história mundial, desde as primeiras civilizações até os
                eventos contemporâneos.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                <div className="text-sm text-muted-foreground">Anos de História</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent-foreground mb-2">{timelineEvents.length}</div>
                <div className="text-sm text-muted-foreground">Eventos Principais</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-destructive mb-2">{regions.length - 1}</div>
                <div className="text-sm text-muted-foreground">Regiões Cobertas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{categories.length - 1}</div>
                <div className="text-sm text-muted-foreground">Categorias</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
