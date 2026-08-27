import { ArticlePageRuntime } from "@/components/article-page-runtime"
import { getNewsArticleBySlug, getNewsArticleMetaBySlug, getRelatedNews } from "@/lib/news"
import { notFound } from "next/navigation"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

export const revalidate = 300

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const meta = await getNewsArticleMetaBySlug(params.slug)

  if (!meta) {
    return { title: "Noticia nao encontrada" }
  }

  return {
    title: `${meta.titulo} | Eventos Historicos`,
    description: meta.descricao,
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
