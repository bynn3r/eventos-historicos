import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Linha do Tempo | Eventos Históricos",
  description:
    "Explore cronologicamente os principais eventos que moldaram a história da humanidade, da Antiguidade aos dias atuais. Filtre por período, região e categoria.",
  alternates: {
    canonical: "https://eventoshistoricos.com.br/linha-do-tempo",
  },
  openGraph: {
    title: "Linha do Tempo da História | Eventos Históricos",
    description:
      "Explore cronologicamente os principais eventos históricos mundiais. Filtre por período, região e categoria.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/linha-do-tempo",
  },
}

export default function LinhaDoTempoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
