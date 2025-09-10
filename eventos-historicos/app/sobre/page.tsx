import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, BookOpen, Users } from "lucide-react"
import Image from "next/image"

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Sobre o Eventos Históricos</h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Somos apaixonados por história e comprometidos em tornar o conhecimento geopolítico acessível a todos os
                brasileiros
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Nossa Missão</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Democratizar o acesso ao conhecimento histórico e geopolítico, oferecendo análises profundas e
                  conteúdo de qualidade que ajude nossos leitores a compreender melhor o mundo em que vivemos.
                </p>
                <p className="text-lg text-muted-foreground">
                  Acreditamos que entender o passado é fundamental para navegar o presente e construir um futuro melhor.
                  Por isso, nos dedicamos a apresentar a história de forma envolvente, precisa e relevante.
                </p>
              </div>
              <div className="relative aspect-square">
                <Image src="/historical-books-and-world-map-study.jpg" alt="Nossa Missão" fill className="object-cover rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nossos Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Precisão Histórica</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Comprometemo-nos com a veracidade dos fatos e a precisão das informações, sempre baseando nosso
                    conteúdo em fontes confiáveis e pesquisa acadêmica.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <CardTitle>Acessibilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Tornamos o conhecimento histórico acessível a todos, independentemente do nível de educação formal,
                    usando linguagem clara e exemplos práticos.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle>Perspectiva Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oferecemos uma visão ampla e imparcial dos eventos mundiais, considerando múltiplas perspectivas e
                    contextos culturais.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nossa Equipe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Dr. Carlos Mendes",
                  role: "Editor-Chefe",
                  specialty: "Especialista em História Contemporânea",
                  description:
                    "PhD em História pela USP, com 15 anos de experiência em pesquisa acadêmica e jornalismo histórico.",
                },
                {
                  name: "Ana Paula Santos",
                  role: "Analista de Geopolítica",
                  specialty: "Relações Internacionais",
                  description:
                    "Mestre em Relações Internacionais, especializada em conflitos do Oriente Médio e política externa brasileira.",
                },
                {
                  name: "Prof. Roberto Silva",
                  role: "Consultor Histórico",
                  specialty: "História Antiga e Medieval",
                  description:
                    "Professor universitário com doutorado em História Antiga, autor de diversos livros sobre civilizações clássicas.",
                },
              ].map((member, index) => (
                <Card key={index}>
                  <CardHeader className="text-center">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>{member.name}</CardTitle>
                    <Badge variant="secondary">{member.role}</Badge>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="font-medium text-sm text-primary mb-2">{member.specialty}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nosso Impacto</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500K+</div>
                <div className="text-sm opacity-90">Leitores Mensais</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2K+</div>
                <div className="text-sm opacity-90">Artigos Publicados</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-sm opacity-90">Países Cobertos</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5</div>
                <div className="text-sm opacity-90">Anos de Experiência</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
