import { ArticlePageRuntime } from "@/components/article-page-runtime"
import { getNewsArticleBySlug, getNewsArticleMetaBySlug, getRelatedNews } from "@/lib/news"
import { findRelatedContent } from "@/lib/related-content"
import { notFound } from "next/navigation"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

// generateStaticParams() intentionally returns [] below (news slugs are
// dynamic/unpredictable). revalidate/ISR on a route with no pre-built params
// means every request hits Amplify's on-demand-fallback rendering path, which
// 500s on this platform's Web Compute adapter — confirmed via the build's
// route table (this page marked ● SSG instead of ƒ Dynamic) and reproduced
// live (every /noticias/[slug] request currently returns 500). force-dynamic
// avoids that fallback path entirely. Data fetches are cheap now (DynamoDB
// reads, ~10-20ms) so this doesn't cost the performance revalidate bought.
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  return []
}

const SITE_URL = "https://eventoshistoricos.com.br"

export async function generateMetadata({ params }: NoticiaPageProps) {
  const meta = await getNewsArticleMetaBySlug(params.slug)

  if (!meta) {
    return { title: "Notícia não encontrada" }
  }

  const url = `${SITE_URL}/noticias/${params.slug}`
  const description = meta.descricao && meta.descricao.length > 160
    ? `${meta.descricao.substring(0, 157)}...`
    : meta.descricao

  return {
    title: `${meta.titulo} | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.titulo,
      description,
      type: "article",
      locale: "pt_BR",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.titulo,
      description,
    },
  }
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const [noticia, relatedNews] = await Promise.all([
    getNewsArticleBySlug(params.slug),
    getRelatedNews(params.slug, 2),
  ])

  if (!noticia) {
    notFound()
  }

  const relatedHistorical = findRelatedContent(`${noticia.titulo} ${noticia.descricao}`, { category: noticia.categoria })

  return <ArticlePageRuntime noticia={noticia} relatedNews={relatedNews} relatedHistorical={relatedHistorical} />
}
