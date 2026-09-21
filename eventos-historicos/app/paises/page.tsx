import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Flag, ArrowRight } from "lucide-react"
import { getAllCountries } from "@/lib/countries"

export const metadata: Metadata = {
  title: "Países | Eventos Históricos",
  description: "Explore a história mundial organizada por país — eventos que marcaram cada nação ao longo do tempo.",
  alternates: { canonical: "https://eventoshistoricos.com.br/paises" },
  openGraph: {
    title: "Países | Eventos Históricos",
    description: "Explore os eventos que marcaram cada país ao longo da história.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/paises",
  },
}

export default function PaisesPage() {
  const countries = [...getAllCountries()].sort((a, b) => b.events.length - a.events.length)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Flag className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Países</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {countries.length} países e entidades históricas, cada um com sua trajetória na Linha do Tempo.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => (
                <Link
                  key={country.slug}
                  href={`/paises/${country.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {country.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {country.events[0].dateDisplay} — {country.events[country.events.length - 1].dateDisplay}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Badge variant="secondary">
                      {country.events.length} evento{country.events.length !== 1 ? "s" : ""}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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
