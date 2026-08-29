import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, MapPin, Globe2, BookOpen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import grandesEventosData from "@/data/grandes-eventos.json"
import { getAllTimelineEvents, getTimelineEventBySlug, getRelatedTimelineEvents } from "@/lib/timeline"
import { findRelatedContent } from "@/lib/related-content"

const SITE_URL = "https://eventoshistoricos.com.br"

interface LinhaDoTempoEventoPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return getAllTimelineEvents().map((event) => ({ slug: event.slug }))
}

export async function generateMetadata({ params }: LinhaDoTempoEventoPageProps) {
  const event = getTimelineEventBySlug(params.slug)

  if (!event) {
    return { title: "Evento não encontrado" }
  }

  const description = event.summary.length > 160 ? `${event.summary.slice(0, 157)}...` : event.summary
  const url = `${SITE_URL}/linha-do-tempo/${event.slug}`

  return {
    title: `${event.title} (${event.dateDisplay}) | Linha do Tempo | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${event.title} (${event.dateDisplay})`,
      description,
      url,
      type: "article",
      locale: "pt_BR",
      images: event.image ? [{ url: `${SITE_URL}${event.image}` }] : undefined,
    },
  }
}

export default function LinhaDoTempoEventoPage({ params }: LinhaDoTempoEventoPageProps) {
  const event = getTimelineEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  const relatedEvents = getRelatedTimelineEvents(event)
  const relatedCuriosidades = findRelatedContent(`${event.title} ${event.summary}`, {
    category: event.category,
    excludeSlug: event.slug,
    onlyType: "curiosidade",
    limit: 3,
  })
  const hasFlagshipExperience = grandesEventosData.some((flagship) => flagship.slug === event.slug)

  const allSorted = getAllTimelineEvents().sort((a, b) => a.startYear - b.startYear)
  const currentIndex = allSorted.findIndex((e) => e.slug === event.slug)
  const prevEvent = currentIndex > 0 ? allSorted[currentIndex - 1] : null
  const nextEvent = currentIndex < allSorted.length - 1 ? allSorted[currentIndex + 1] : null
  const url = `${SITE_URL}/linha-do-tempo/${event.slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: event.title,
        description: event.summary,
        image: event.image ? `${SITE_URL}${event.image}` : undefined,
        articleSection: event.category,
        about: {
          "@type": "Event",
          name: event.title,
          startDate: `${event.startYear}`,
          endDate: `${event.endYear}`,
          location: {
            "@type": "Place",
            name: [event.country, event.region].filter(Boolean).join(", "),
          },
          description: event.summary,
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Linha do Tempo", item: `${SITE_URL}/linha-do-tempo` },
          { "@type": "ListItem", position: 3, name: event.title, item: url },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Início
              </Link>
              <span className="mx-2">/</span>
              <Link href="/linha-do-tempo" className="hover:text-foreground">
                Linha do Tempo
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{event.title}</span>
            </nav>

            <Button variant="ghost" asChild className="mb-6 pl-0">
              <Link href="/linha-do-tempo">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar à Linha do Tempo
              </Link>
            </Button>

            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="text-base font-bold px-3 py-1">{event.dateDisplay}</Badge>
                <Badge variant="secondary">{event.period}</Badge>
                <Badge variant="outline">{event.category}</Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-balance mb-6">{event.title}</h1>

              <p className="text-xl text-muted-foreground text-pretty max-w-3xl mb-4">{event.summary}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.country} · {event.region}
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {event.image && (
              <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
                <Image src={event.image} alt={event.title} fill priority className="object-cover" />
              </div>
            )}

            {/* Flagship experience banner */}
            {hasFlagshipExperience && (
              <Card className="mb-10 border-primary/30 bg-primary/5">
                <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      Esse evento tem uma experiência imersiva completa
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Linha do tempo interativa, mapa e figuras históricas em detalhe.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/evento/${event.slug}`}>
                      Explorar experiência completa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {event.content.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index} className="mb-6 text-lg leading-relaxed last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Characters */}
            {event.characters.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Personagens
                </h2>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {event.characters.map((character) => (
                    <div key={character.name} className="text-center">
                      {character.image && (
                        <div className="relative mx-auto aspect-square w-full max-w-[140px] overflow-hidden rounded-full border bg-muted">
                          <Image src={character.image} alt={character.name} fill className="object-cover" />
                        </div>
                      )}
                      <h3 className="mt-4 font-semibold text-foreground">{character.name}</h3>
                      <p className="text-sm text-primary">{character.role}</p>
                      {character.description && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{character.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {event.sources.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Globe2 className="h-5 w-5" />
                  Fontes
                </h2>
                <ul className="space-y-2">
                  {event.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">Eventos Relacionados</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {relatedEvents.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/linha-do-tempo/${related.slug}`}
                      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>{related.dateDisplay}</Badge>
                        <Badge variant="secondary">{related.category}</Badge>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{related.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related curiosidades */}
            {relatedCuriosidades.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">Curiosidades Relacionadas</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {relatedCuriosidades.map((related) => (
                    <Link
                      key={related.slug}
                      href={related.href}
                      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{related.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Navegação anterior / próximo */}
        {(prevEvent || nextEvent) && (
          <nav aria-label="Navegação entre eventos" className="border-t bg-muted/30 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {prevEvent ? (
                  <Link
                    href={`/linha-do-tempo/${prevEvent.slug}`}
                    className="group flex items-start gap-3 rounded-lg border bg-background p-4 hover:shadow-md transition-shadow"
                  >
                    <ArrowLeft className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Evento anterior</p>
                      <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors truncate">
                        {prevEvent.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{prevEvent.dateDisplay}</p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextEvent && (
                  <Link
                    href={`/linha-do-tempo/${nextEvent.slug}`}
                    className="group flex items-start gap-3 rounded-lg border bg-background p-4 hover:shadow-md transition-shadow sm:flex-row-reverse sm:text-right"
                  >
                    <ArrowRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Próximo evento</p>
                      <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors truncate">
                        {nextEvent.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{nextEvent.dateDisplay}</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  )
}
