import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Swords, ArrowRight } from "lucide-react"
import { getAllWars } from "@/lib/wars"

export const metadata: Metadata = {
  title: "Guerras e Conflitos | Eventos Históricos",
  description:
    "Explore as principais guerras e conflitos armados da história, com cronologia interna e artigos completos.",
  alternates: { canonical: "https://eventoshistoricos.com.br/guerras" },
  openGraph: {
    title: "Guerras e Conflitos | Eventos Históricos",
    description: "Cronologia interna e contexto completo das principais guerras da história.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/guerras",
  },
}

export default function GuerrasPage() {
  const wars = [...getAllWars()].sort((a, b) => a.events[0].startYear - b.events[0].startYear)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Swords className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Guerras e Conflitos</h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                A cronologia interna dos conflitos armados que redesenharam fronteiras, impérios e o curso da história.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wars.map((war) => (
                <Link
                  key={war.slug}
                  href={`/guerras/${war.slug}`}
                  className="group flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-700">
                    <Swords className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {war.name}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground line-clamp-3">{war.summary}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <Badge variant="secondary">{war.yearsDisplay}</Badge>
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
