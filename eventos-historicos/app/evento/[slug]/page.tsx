import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventJourney } from "@/components/evento/event-journey"
import { EventMap } from "@/components/evento/event-map"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowDown } from "lucide-react"
import { notFound } from "next/navigation"
import grandesEventosData from "@/data/grandes-eventos.json"
import curiosidadesData from "@/data/curiosidades.json"

interface EventoPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return grandesEventosData.map((evento) => ({ slug: evento.slug }))
}

export async function generateMetadata({ params }: EventoPageProps) {
  const evento = grandesEventosData.find((e) => e.slug === params.slug)

  if (!evento) {
    return { title: "Evento não encontrado" }
  }

  return {
    title: `${evento.titulo} (${evento.ano}) | Eventos Históricos`,
    description: evento.hook,
  }
}

export default function EventoPage({ params }: EventoPageProps) {
  const evento = grandesEventosData.find((e) => e.slug === params.slug)

  if (!evento) {
    notFound()
  }

  const curiosidadesRelacionadas = curiosidadesData.filter((c) =>
    evento.curiosidadesRelacionadas?.includes(c.id),
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        {/* Hero imersivo */}
        <section className="relative flex min-h-[85vh] items-end overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={evento.heroImagem}
              alt={evento.heroLegenda}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          </div>

          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 pb-16 pt-32 sm:px-6 lg:px-8">
              <Button
                variant="ghost"
                asChild
                className="mb-6 pl-0 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Link href="/grandes-eventos">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar aos Grandes Eventos
                </Link>
              </Button>

              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground text-base font-bold px-3 py-1">
                  {evento.ano}
                </Badge>
                <Badge variant="outline" className="border-white/40 text-white">
                  {evento.categoria}
                </Badge>
              </div>

              <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-balance text-white md:text-6xl lg:text-7xl">
                {evento.titulo}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85 md:text-xl">{evento.hook}</p>

              <p className="mt-3 text-sm text-white/60">{evento.heroLegenda}</p>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70">
            <ArrowDown className="h-6 w-6 animate-bounce" />
          </div>
        </section>

        {/* Estatísticas */}
        <section className="border-b bg-card">
          <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
            {evento.estatisticas.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-foreground md:text-3xl">{stat.valor}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contexto */}
        <section className="py-16">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Como chegamos até aqui</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{evento.contexto}</p>
          </div>
        </section>

        {/* Jornada / momentos-chave */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">{evento.jornadaTitulo}</h2>
              <p className="mt-3 text-muted-foreground">{evento.jornadaDescricao}</p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl">
              <EventJourney momentos={evento.momentos} />
            </div>
          </div>
        </section>

        {/* Mapa interativo */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">{evento.mapaTitulo}</h2>
              <p className="mt-3 text-muted-foreground">{evento.mapaDescricao}</p>
            </div>

            <div className="mt-12">
              <EventMap locais={evento.locais} />
            </div>
          </div>
        </section>

        {/* Figuras-chave */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Quem decidiu os rumos da história</h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
              {evento.figuras.map((figura) => (
                <div key={figura.nome} className="text-center">
                  <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-full border bg-muted">
                    <Image src={figura.imagem} alt={figura.nome} fill className="object-cover" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{figura.nome}</h3>
                  <p className="text-sm text-primary">{figura.papel}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{figura.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legado */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">O legado</h2>
            <div className="mt-5 space-y-5">
              {evento.legado.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index} className="text-lg leading-8 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Curiosidades relacionadas */}
        {curiosidadesRelacionadas.length > 0 && (
          <section className="border-t bg-muted/30 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Aprofunde-se</h2>
              <p className="mt-2 text-muted-foreground">Curiosidades relacionadas a este evento</p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {curiosidadesRelacionadas.map((curiosidade) => (
                  <Link
                    key={curiosidade.id}
                    href={`/curiosidades/${curiosidade.slug}`}
                    className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={curiosidade.imagem}
                        alt={curiosidade.titulo}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                        {curiosidade.titulo}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
