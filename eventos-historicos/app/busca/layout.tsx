import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buscar | Eventos Históricos",
  description: "Busque eventos históricos, personagens, curiosidades e notícias de geopolítica.",
  alternates: {
    canonical: "https://eventoshistoricos.com.br/busca",
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function BuscaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
