import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventCronologia } from "@/components/event-cronologia"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, BookOpen, Crown } from "lucide-react"
import { notFound } from "next/navigation"
import { getEmpireBySlug, generateEmpireStaticParams } from "@/lib/empires"
import grandesEventosData from "@/data/grandes-eventos.json"

const SITE_URL = "https://eventoshistoricos.com.br"

interface ImperioPageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return generateEmpireStaticParams()
}

export async function generateMetadata({ params }: ImperioPageProps) {
  const empire = getEmpireBySlug(params.slug)
  if (!empire) return { title: "Império não encontrado" }

  const url = `${SITE_URL}/imperios/${empire.slug}`
  const description = empire.summary.length > 160 ? `${empire.summary.slice(0, 157)}...` : empire.summary

  return {
    title: `${empire.name} (${empire.yearsDisplay}) | Impérios | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${empire.name} (${empire.yearsDisplay})`,
      description,
      url,
      type: "article",
      locale: "pt_BR",
    },
  }
}

const PERIOD_COLORS: Record<string, string> = {
  "Idade Antiga": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Idade Média": "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  "Idade Moderna": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  "Idade Contemporânea": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

export default function ImperioPage({ params }: ImperioPageProps) {
  const empire = getEmpireBySlug(params.slug)
  if (!empire) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: empire.name,
    description: empire.summary,
    url: `${SITE_URL}/imperios/${empire.slug}`,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" asChild className="mb-8 pl-0 text-muted-foreground hover:text-foreground">
              <Link href="/imperios">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Todos os Impérios
              </Link>
            </Button>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-700 text-white gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                Império
              </Badge>
              <Badge variant="secondary">{empire.yearsDisplay}</Badge>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{empire.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{empire.summary}</p>
          </div>
        </section>

        {/* Cronologia interna — uma seção por evento membro, em ordem cronológica */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {empire.events.map((event) =>
              event.cronologia && event.cronologia.length > 0 ? (
                <EventCronologia
                  key={event.slug}
                  cronologia={event.cronologia}
                  title={empire.events.length > 1 ? `Cronologia — ${event.title}` : "Cronologia"}
                />
              ) : null
            )}
          </div>
        </section>

        {/* Artigos completos */}
        <section className="border-t py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
              Artigo{empire.events.length !== 1 ? "s" : ""} completo{empire.events.length !== 1 ? "s" : ""}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {empire.events.map((event) => {
                const hasFlagship = grandesEventosData.some((f) => f.slug === event.slug)
                return (
                  <div
                    key={event.slug}
                    className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    {event.image && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{event.dateDisplay}</Badge>
                        <Badge className={PERIOD_COLORS[event.period] ?? "bg-gray-100 text-gray-800"}>
                          {event.period}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground leading-snug">{event.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground line-clamp-3">
                        {event.summary}
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <Link
                          href={`/linha-do-tempo/${event.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Ler artigo completo
                        </Link>
                        {hasFlagship && (
                          <Link
                            href={`/evento/${event.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Experiência imersiva
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
