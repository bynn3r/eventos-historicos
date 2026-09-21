import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Map as MapIcon } from "lucide-react"
import { getAllTimelineEvents } from "@/lib/timeline"
import { HistoricalWorldMap } from "@/components/historical-world-map"

export const metadata: Metadata = {
  title: "Mapa Histórico | Eventos Históricos",
  description:
    "Explore os 51 eventos da Linha do Tempo em um mapa-múndi interativo, filtrando por período histórico.",
  alternates: { canonical: "https://eventoshistoricos.com.br/mapa" },
  openGraph: {
    title: "Mapa Histórico | Eventos Históricos",
    description: "Explore a história mundial geograficamente, filtrando por período.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/mapa",
  },
}

const PERIOD_COLORS: Record<string, string> = {
  "Idade Antiga": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Idade Média": "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  "Idade Moderna": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  "Idade Contemporânea": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

export default function MapaPage() {
  const events = [...getAllTimelineEvents()].sort((a, b) => a.startYear - b.startYear)

  const mapEvents = events.map((e) => ({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    dateDisplay: e.dateDisplay,
    period: e.period,
    category: e.category,
    coordinates: e.coordinates,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <MapIcon className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Mapa Histórico</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Os {events.length} eventos da Linha do Tempo espalhados pelo mundo. Filtre por período e clique nos
                marcadores para explorar.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <HistoricalWorldMap events={mapEvents} />
          </div>
        </section>

        {/* Lista textual acessível — alternativa ao mapa visual para navegação por teclado/leitor de tela */}
        <section className="border-t py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">Todos os eventos, em ordem cronológica</h2>
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <li key={event.slug}>
                  <Link
                    href={`/linha-do-tempo/${event.slug}`}
                    className="group flex flex-col gap-1.5 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{event.dateDisplay}</Badge>
                      <Badge className={`text-xs ${PERIOD_COLORS[event.period] ?? ""}`}>{event.period}</Badge>
                    </div>
                    <span className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
                      {event.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{event.country}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
