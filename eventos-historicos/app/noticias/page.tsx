import { NewsPageContent } from "@/components/news-page-content"
import { getCuratedNews } from "@/lib/news"

export default async function NoticiasPage() {
  const { rssArticles, localArticles } = await getCuratedNews(20)

  return <NewsPageContent rssArticles={rssArticles} localArticles={localArticles} />
}
