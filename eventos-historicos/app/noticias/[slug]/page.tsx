import { ArticlePageRuntime } from "@/components/article-page-runtime"
import { getNewsArticleBySlug, getRelatedNews } from "@/lib/news"
import { notFound } from "next/navigation"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const noticia = await getNewsArticleBySlug(params.slug)

  if (!noticia) {
    return { title: "Noticia nao encontrada" }
  }

  return {
    title: `${noticia.titulo} | Eventos Historicos`,
    description: noticia.descricao,
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

  return <ArticlePageRuntime noticia={noticia} relatedNews={relatedNews} />
}
