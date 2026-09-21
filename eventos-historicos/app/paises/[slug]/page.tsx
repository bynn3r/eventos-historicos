import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Flag } from "lucide-react"
import { notFound } from "next/navigation"
import { getCountryBySlug, generateCountryStaticParams } from "@/lib/countries"

const SITE_URL = "https://eventoshistoricos.com.br"

interface PaisPageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return generateCountryStaticParams()
}

export async function generateMetadata({ params }: PaisPageProps) {
  const country = getCountryBySlug(params.slug)
  if (!country) return { title: "País não encontrado" }

  const url = `${SITE_URL}/paises/${country.slug}`
  const description = `Os eventos que marcaram ${country.name} na Linha do Tempo: de ${country.events[0].dateDisplay} a ${country.events[country.events.length - 1].dateDisplay}.`

  return {
    title: `${country.name} | Países | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${country.name} — Eventos Históricos`,
      description,
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

export default function PaisPage({ params }: PaisPageProps) {
  const country = getCountryBySlug(params.slug)
  if (!country) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: country.name,
    url: `${SITE_URL}/paises/${country.slug}`,
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
              <Link href="/paises">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Todos os Países
              </Link>
            </Button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Flag className="h-6 w-6 text-primary" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{country.name}</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              {country.events.length} evento{country.events.length !== 1 ? "s" : ""} na Linha do Tempo, de{" "}
              {country.events[0].dateDisplay} a {country.events[country.events.length - 1].dateDisplay}.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {country.events.map((event) => (
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
