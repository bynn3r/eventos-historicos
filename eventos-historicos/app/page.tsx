import type { Metadata } from "next"
import { HomePageRuntime } from "@/components/home-page-runtime"
import { getRssNews } from "@/lib/news"

export const metadata: Metadata = {
  title: "Eventos Históricos | Geopolítica e História Mundial",
  description:
    "Portal brasileiro de geopolítica, curiosidades históricas e análises dos grandes eventos que moldaram a humanidade. Explore a Linha do Tempo interativa.",
  alternates: {
    canonical: "https://eventoshistoricos.com.br",
  },
  openGraph: {
    title: "Eventos Históricos | Geopolítica e História Mundial",
    description:
      "Portal brasileiro de geopolítica, curiosidades históricas e análises dos grandes eventos que moldaram a humanidade.",
    type: "website",
    locale: "pt_BR",
    url: "https://eventoshistoricos.com.br",
  },
}

// Server-rendered so the initial HTML already carries real, translated
// headlines (SEO + no blank flash before hydration) — DynamoDB reads here
// are ~10-20ms, so this is safe unlike the old on-demand RSS+translate path.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const featuredNews = await getRssNews(4)
  return <HomePageRuntime initialFeaturedNews={featuredNews} />
}
