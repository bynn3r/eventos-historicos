import { HomePageRuntime } from "@/components/home-page-runtime"
import { getRssNews } from "@/lib/news"

// Server-rendered so the initial HTML already carries real, translated
// headlines (SEO + no blank flash before hydration) — DynamoDB reads here
// are ~10-20ms, so this is safe unlike the old on-demand RSS+translate path.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const featuredNews = await getRssNews(4)
  return <HomePageRuntime initialFeaturedNews={featuredNews} />
}
