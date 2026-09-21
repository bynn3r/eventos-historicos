import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Landmark, Mountain, Compass, Sun, MapPin, Globe, ArrowRight } from "lucide-react"
import { getAllContinents } from "@/lib/regions"

export const metadata: Metadata = {
  title: "Regiões e Continentes | Eventos Históricos",
  description:
    "Explore a história mundial por continente: Europa, Ásia, África, Américas, Oriente Médio e eventos globais.",
  alternates: { canonical: "https://eventoshistoricos.com.br/regioes" },
  openGraph: {
    title: "Regiões e Continentes | Eventos Históricos",
    description: "Explore os eventos que moldaram cada continente ao longo da história.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/regioes",
  },
}

const CONTINENT_VISUALS: Record<string, { icon: typeof Globe; color: string }> = {
  europa: { icon: Landmark, color: "bg-sky-600" },
  asia: { icon: Mountain, color: "bg-rose-600" },
  "oriente-medio": { icon: Compass, color: "bg-amber-600" },
  africa: { icon: Sun, color: "bg-orange-600" },
  americas: { icon: MapPin, color: "bg-emerald-600" },
  global: { icon: Globe, color: "bg-slate-600" },
}

export default function RegioesPage() {
  const continents = getAllContinents()

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Regiões e Continentes
              </h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Explore os eventos que moldaram cada canto do mundo, do Egito Antigo à Guerra Fria.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {continents.map((continent) => {
                const visual = CONTINENT_VISUALS[continent.slug] ?? { icon: Globe, color: "bg-gray-600" }
                const Icon = visual.icon
                return (
                  <Link
                    key={continent.slug}
                    href={`/regioes/${continent.slug}`}
                    className="group flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${visual.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {continent.name}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {continent.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <Badge variant="secondary">
                        {continent.events.length} evento{continent.events.length !== 1 ? "s" : ""}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Explorar
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
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
