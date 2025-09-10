import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Clock, Globe, Crown, Sword, Scroll, Search } from "lucide-react"
import Link from "next/link"

export default function CuriosidadesPage() {
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
              {[
                {
                  icon: BookOpen,
                  title: "A Biblioteca de Alexandria Nunca Foi Totalmente Destruída",
                  content:
                    "Contrário à crença popular, a famosa Biblioteca de Alexandria não foi destruída em um único evento catastrófico. Na verdade, ela declinou gradualmente ao longo de vários séculos devido a cortes de financiamento, mudanças políticas e desastres naturais.",
                  period: "Antiguidade",
                  readTime: "3 min",
                },
                {
                  icon: Globe,
                  title: "O Império Mongol Era Maior que a África",
                  content:
                    "O Império Mongol, no seu auge, cobria aproximadamente 24 milhões de km² - maior que todo o continente africano. Estendia-se da Europa Oriental até o Oceano Pacífico, sendo o maior império contíguo da história.",
                  period: "Século XIII",
                  readTime: "4 min",
                },
                {
                  icon: Crown,
                  title: "Cleópatra Viveu Mais Próxima da Chegada do Homem à Lua",
                  content:
                    "Cleópatra VII viveu mais próxima temporalmente da chegada do homem à Lua (1969) do que da construção da Grande Pirâmide de Gizé. Ela nasceu em 69 a.C., enquanto a pirâmide foi construída por volta de 2580 a.C.",
                  period: "Antiguidade",
                  readTime: "2 min",
                },
                {
                  icon: Sword,
                  title: "A Guerra dos Cem Anos Durou 116 Anos",
                  content:
                    "Apesar do nome, a Guerra dos Cem Anos entre Inglaterra e França durou na verdade 116 anos (1337-1453). Além disso, não foi uma guerra contínua, mas uma série de conflitos com longos períodos de paz entre eles.",
                  period: "Idade Média",
                  readTime: "5 min",
                },
                {
                  icon: Scroll,
                  title: "Os Vikings Chegaram à América 500 Anos Antes de Colombo",
                  content:
                    "Leif Erikson e outros exploradores vikings estabeleceram assentamentos na América do Norte por volta do ano 1000 d.C., quase 500 anos antes da viagem de Cristóvão Colombo em 1492. Evidências arqueológicas confirmam sua presença no Canadá.",
                  period: "Idade Média",
                  readTime: "4 min",
                },
                {
                  icon: Globe,
                  title: "O Império Romano Durou Mais de 1000 Anos",
                  content:
                    "Embora o Império Romano do Ocidente tenha caído em 476 d.C., o Império Romano do Oriente (Bizantino) continuou existindo até 1453, quando Constantinopla foi conquistada pelos otomanos. No total, o Império Romano durou mais de 1000 anos.",
                  period: "Antiguidade/Idade Média",
                  readTime: "6 min",
                },
                {
                  icon: BookOpen,
                  title: "A Pedra de Roseta Não Foi a Primeira Chave para os Hieróglifos",
                  content:
                    "Embora famosa por permitir a decifração dos hieróglifos egípcios, a Pedra de Roseta não foi o primeiro texto trilíngue descoberto. Outros textos similares já existiam, mas a Pedra de Roseta foi a mais bem preservada e acessível aos estudiosos.",
                  period: "Antiguidade",
                  readTime: "3 min",
                },
                {
                  icon: Crown,
                  title: "Napoleão Não Era Baixo Para os Padrões da Época",
                  content:
                    "Napoleão Bonaparte media cerca de 1,70m, o que era considerado altura média ou até acima da média para homens franceses do século XVIII. A confusão surgiu devido às diferenças entre as medidas francesas e inglesas da época.",
                  period: "Século XIX",
                  readTime: "2 min",
                },
                {
                  icon: Scroll,
                  title: "A Grande Muralha da China Não É Visível do Espaço",
                  content:
                    "Contrário ao mito popular, a Grande Muralha da China não é visível a olho nu do espaço. Esta lenda urbana foi desmentida por vários astronautas. A muralha é muito estreita e tem cor similar ao solo ao redor.",
                  period: "Antiguidade",
                  readTime: "3 min",
                },
              ].map((curiosity, index) => {
                const IconComponent = curiosity.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{curiosity.period}</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{curiosity.readTime}</span>
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{curiosity.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{curiosity.content}</p>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/curiosidade/${index + 1}`}>Leia Mais</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
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
