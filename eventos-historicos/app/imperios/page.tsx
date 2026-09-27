import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Crown, ArrowRight } from "lucide-react"
import { getAllEmpires } from "@/lib/empires"

export const metadata: Metadata = {
  title: "Impérios | Eventos Históricos",
  description: "Explore a trajetória de grandes impérios da história, da fundação à queda.",
  alternates: { canonical: "https://eventoshistoricos.com.br/imperios" },
  openGraph: {
    title: "Impérios | Eventos Históricos",
    description: "Da fundação à queda: a trajetória dos grandes impérios da história.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/imperios",
  },
}

export default function ImperiosPage() {
  const empires = [...getAllEmpires()].sort((a, b) => a.events[0].startYear - b.events[0].startYear)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Crown className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Impérios</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Da fundação à queda: a trajetória dos grandes impérios que moldaram territórios, línguas e culturas
                inteiras.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {empires.map((empire) => (
                <Link
                  key={empire.slug}
                  href={`/imperios/${empire.slug}`}
                  className="group flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {empire.name}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground line-clamp-3">
                    {empire.summary}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <Badge variant="secondary">{empire.yearsDisplay}</Badge>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Explorar
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
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
