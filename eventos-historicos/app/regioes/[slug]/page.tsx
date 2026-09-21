import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin } from "lucide-react"
import { notFound } from "next/navigation"
import { getContinentBySlug, generateContinentStaticParams } from "@/lib/regions"

const SITE_URL = "https://eventoshistoricos.com.br"

interface RegiaoPageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return generateContinentStaticParams()
}

export async function generateMetadata({ params }: RegiaoPageProps) {
  const continent = getContinentBySlug(params.slug)
  if (!continent) return { title: "Região não encontrada" }

  const url = `${SITE_URL}/regioes/${continent.slug}`
  const title = `${continent.name} | Regiões | Eventos Históricos`

  return {
    title,
    description: continent.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${continent.name} — Eventos Históricos`,
      description: continent.description,
      url,
      type: "website",
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

export default function RegiaoPage({ params }: RegiaoPageProps) {
  const continent = getContinentBySlug(params.slug)
  if (!continent) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: continent.name,
    description: continent.description,
    url: `${SITE_URL}/regioes/${continent.slug}`,
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
              <Link href="/regioes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Todas as Regiões
              </Link>
            </Button>

            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{continent.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{continent.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline">
                {continent.events.length} evento{continent.events.length !== 1 ? "s" : ""}
              </Badge>
              {continent.countries.slice(0, 8).map((country) => (
                <Badge key={country} variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {country}
                </Badge>
              ))}
              {continent.countries.length > 8 && (
                <Badge variant="secondary">+{continent.countries.length - 8} outros</Badge>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {continent.events.map((event) => (
                <Link
                  key={event.slug}
                  href={`/linha-do-tempo/${event.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
                >
                  {event.image && (
                    <div className="relative aspect-[16/10] overflow-hidden">
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
                    <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground line-clamp-3">
                      {event.summary}
                    </p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">{event.country}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
