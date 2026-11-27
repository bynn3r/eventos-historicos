import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import imageCredits from "@/data/image-credits.json"
import { existingImage } from "@/lib/public-images"

export const metadata: Metadata = {
  title: "Créditos das imagens | Eventos Históricos",
  description: "Autoria e licença das imagens de terceiros usadas no Eventos Históricos.",
  alternates: { canonical: "https://eventoshistoricos.com.br/creditos" },
}

interface ImageCredit {
  arquivo: string
  titulo: string
  autor: string
  licenca: string
  fonte: string
}

// Lista apenas imagens que exigem atribuição (Creative Commons / OGL).
// Imagens em domínio público não precisam constar aqui.
const credits = (imageCredits as ImageCredit[])
  .filter((c) => existingImage(c.arquivo))
  .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))

export default function CreditosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section className="container mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Créditos das imagens</h1>
          <p className="mt-4 text-muted-foreground">
            Parte das imagens do site vem do Wikimedia Commons sob licenças livres que pedem atribuição. Abaixo estão
            autor, licença e link para a página original de cada uma. As demais imagens são de domínio público ou
            próprias.
          </p>

          <ul className="mt-10 divide-y rounded-xl border">
            {credits.map((c) => (
              <li key={c.arquivo} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-baseline sm:gap-4">
                <span className="font-medium text-foreground sm:w-1/3">{c.titulo}</span>
                <span className="text-muted-foreground sm:flex-1">
                  {c.autor} · {c.licenca} ·{" "}
                  <a
                    href={c.fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    fonte
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  )
}
