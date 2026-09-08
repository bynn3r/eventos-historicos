import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, BookOpen } from "lucide-react"
import { notFound } from "next/navigation"
import { getCharacterBySlug, generateCharacterStaticParams } from "@/lib/characters"
import grandesEventosData from "@/data/grandes-eventos.json"

interface PersonagemPageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return generateCharacterStaticParams()
}

export async function generateMetadata({ params }: PersonagemPageProps) {
  const character = getCharacterBySlug(params.slug)
  if (!character) return { title: "Personagem não encontrado" }

  const description = character.description
    ? character.description.length > 160
      ? `${character.description.slice(0, 157)}...`
      : character.description
    : `${character.role} — aparece em ${character.events.length} evento(s) histórico(s).`

  const url = `https://eventoshistoricos.com.br/personagens/${character.slug}`

  return {
    title: `${character.name} | Personagens | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: character.name,
      description,
      url,
      type: "profile",
      locale: "pt_BR",
      images: character.image ? [{ url: `https://eventoshistoricos.com.br${character.image}`, alt: character.name }] : undefined,
    },
  }
}

const PERIOD_COLORS: Record<string, string> = {
  "Idade Antiga": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Idade Média": "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  "Idade Moderna": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  "Idade Contemporânea": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

export default function PersonagemPage({ params }: PersonagemPageProps) {
  const character = getCharacterBySlug(params.slug)
  if (!character) notFound()

  const eventsSorted = [...character.events].sort((a, b) => a.startYear - b.startYear)
  const hasFlagship = (slug: string) => grandesEventosData.some((e) => e.slug === slug)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: character.name,
    jobTitle: character.role,
    description: character.description || undefined,
    image: character.image ? `https://eventoshistoricos.com.br${character.image}` : undefined,
    url: `https://eventoshistoricos.com.br/personagens/${character.slug}`,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />

      <main className="flex-1 bg-background">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" asChild className="mb-8 pl-0 text-muted-foreground hover:text-foreground">
              <Link href="/personagens">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Todos os Personagens
              </Link>
            </Button>

            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:text-left">
              {character.image ? (
                <div className="relative aspect-square w-36 flex-shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl bg-muted">
                  <Image src={character.image} alt={character.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-square w-36 flex-shrink-0 items-center justify-center rounded-full border-4 border-background shadow-xl bg-muted text-5xl font-bold text-muted-foreground">
                  {character.name.charAt(0)}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                  {character.name}
                </h1>
                <p className="mt-2 text-lg font-medium text-primary">{character.role}</p>
                {character.description && (
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                    {character.description}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {[...new Set(eventsSorted.map((e) => e.period))].map((period) => (
                    <Badge
                      key={period}
                      className={PERIOD_COLORS[period] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}
                    >
                      {period}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {character.events.length} evento{character.events.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Eventos onde aparece */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
              Eventos históricos
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventsSorted.map((ev) => (
                <div
                  key={ev.slug}
                  className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{ev.dateDisplay}</Badge>
                    <Badge
                      className={PERIOD_COLORS[ev.period] ?? "bg-gray-100 text-gray-800"}
                    >
                      {ev.period}
                    </Badge>
                  </div>
                  <h3 className="mb-4 font-semibold text-foreground leading-snug">{ev.title}</h3>

                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <Link
                      href={`/linha-do-tempo/${ev.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Ler artigo
                    </Link>
                    {hasFlagship(ev.slug) && (
                      <Link
                        href={`/evento/${ev.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Experiência imersiva
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
