import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Users } from "lucide-react"
import { getAllCharacters } from "@/lib/characters"

export const metadata = {
  title: "Personagens Históricos | Eventos Históricos",
  description:
    "Conheça os personagens que moldaram a história: líderes, filósofos, generais e revolucionários de todas as eras.",
  alternates: { canonical: "https://eventoshistoricos.com.br/personagens" },
  openGraph: {
    title: "Personagens Históricos",
    description: "152 personagens que mudaram o curso da história — de Júlio César a Gorbachev.",
    url: "https://eventoshistoricos.com.br/personagens",
    type: "website",
    locale: "pt_BR",
  },
}

export default function PersonagensPage() {
  const characters = getAllCharacters()

  const grouped = characters.reduce<Record<string, typeof characters>>((acc, char) => {
    const letter = char.name.charAt(0).toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(char)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        {/* Header */}
        <section className="border-b bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Personagens Históricos
              </h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {characters.length} personagens que moldaram o mundo — líderes, filósofos, generais e
                revolucionários de todas as eras e continentes.
              </p>
            </div>
          </div>
        </section>

        {/* Índice de letras */}
        <section className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-1.5">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letra-${letter}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Lista por letra */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {letters.map((letter) => (
                <div key={letter} id={`letra-${letter}`} className="scroll-mt-32">
                  <h2 className="mb-6 text-3xl font-bold text-primary border-b border-primary/20 pb-2">
                    {letter}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {grouped[letter].map((char) => (
                      <Link
                        key={char.slug}
                        href={`/personagens/${char.slug}`}
                        className="group flex flex-col items-center rounded-xl border bg-card p-4 text-center transition-shadow hover:shadow-lg"
                      >
                        {char.image ? (
                          <div className="relative aspect-square w-16 overflow-hidden rounded-full border bg-muted">
                            <Image
                              src={char.image}
                              alt={char.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-square w-16 items-center justify-center rounded-full border bg-muted text-xl font-bold text-muted-foreground">
                            {char.name.charAt(0)}
                          </div>
                        )}
                        <h3 className="mt-3 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {char.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{char.role}</p>
                        {char.events.length > 1 && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {char.events.length} eventos
                          </Badge>
                        )}
                      </Link>
                    ))}
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
