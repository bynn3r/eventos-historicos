import { ArticlePageRuntime } from "@/components/article-page-runtime"
import { getNewsArticleMetaBySlug } from "@/lib/news"

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
  const noticia = await getNewsArticleMetaBySlug(params.slug)

  if (!noticia) {
    return {
      title: "Noticia nao encontrada",
    }
  }

  return {
    title: `${noticia.titulo} | Eventos Historicos`,
    description: noticia.descricao,
  }
}

export default function NoticiaPage({ params }: NoticiaPageProps) {
  return <ArticlePageRuntime slug={params.slug} />
}
