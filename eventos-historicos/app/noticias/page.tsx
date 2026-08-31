import type { Metadata } from "next"
import { NewsPageRuntime } from "@/components/news-page-runtime"

export const metadata: Metadata = {
  title: "Notícias de Geopolítica | Eventos Históricos",
  description:
    "Notícias e análises de geopolítica com contexto histórico. Entenda os acontecimentos atuais conectados à história.",
  alternates: {
    canonical: "https://eventoshistoricos.com.br/noticias",
  },
  openGraph: {
    title: "Notícias de Geopolítica | Eventos Históricos",
    description: "Notícias e análises de geopolítica com contexto histórico.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br/noticias",
  },
}

export default function NoticiasPage() {
  return <NewsPageRuntime />
}
