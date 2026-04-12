import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { formatNewsDate, getNewsArticleBySlug, getRelatedNews } from "@/lib/news"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const noticia = await getNewsArticleBySlug(params.slug)

  if (!noticia) {
    return {
      title: "Notícia não encontrada",
    }
  }

  return {
    title: `${noticia.titulo} | Eventos Históricos`,
    description: noticia.descricao,
  }
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const noticia = await getNewsArticleBySlug(params.slug)

  if (!noticia) {
    notFound()
  }

  const relatedNews = await getRelatedNews(params.slug, 2)
  const contentParagraphs = noticia.conteudo.split(/\n\s*\n/).filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar às Notícias
                </Link>
              </Button>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatNewsDate(noticia.data)}</span>
                </div>
                <Badge variant="secondary">{noticia.categoria}</Badge>
                <Badge variant="outline">{noticia.tipo === "rss" ? "Leitura interna via RSS" : "Análise do portal"}</Badge>
                {noticia.autor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{noticia.autor}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-balance mb-6">{noticia.titulo}</h1>

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <p className="text-xl text-muted-foreground text-pretty max-w-3xl">{noticia.descricao}</p>
                {noticia.linkFonte && (
                  <Button variant="outline" asChild>
                    <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                      Ver matéria original
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {noticia.imagem && (
              <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
                <Image src={noticia.imagem || "/placeholder.svg"} alt={noticia.titulo} fill className="object-cover" />
              </div>
            )}

            <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-10">
              <div>
                <div className="prose prose-lg max-w-none mb-8">
                  {contentParagraphs.map((paragraph, index) => (
                    <p key={`${noticia.slug}-${index}`} className="text-lg leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {noticia.tipo === "rss" && (
                  <div className="rounded-xl border bg-muted/40 p-5 mb-8">
                    <h2 className="font-semibold mb-2">Crédito e contexto editorial</h2>
                    <p className="text-sm text-muted-foreground">
                      Esta página apresenta uma leitura resumida baseada no feed oficial da fonte citada, organizada
                      dentro da curadoria do Eventos Históricos. A cobertura completa permanece disponível no veículo
                      original.
                    </p>
                  </div>
                )}
              </div>

              <aside className="space-y-6">
                <div className="rounded-xl border p-5">
                  <h2 className="font-semibold mb-3">Fonte da notícia</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Publicada originalmente por <span className="font-medium text-foreground">{noticia.fonte}</span>.
                  </p>
                  {noticia.linkFonte && (
                    <a
                      href={noticia.linkFonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Acessar publicação oficial
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {noticia.tags.length > 0 && (
                  <div className="rounded-xl border p-5">
                    <h2 className="font-semibold mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {noticia.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>

            {relatedNews.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-2xl font-bold mb-6">Notícias Relacionadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedNews.map((related) => (
                    <Link
                      key={related.id}
                      href={related.href}
                      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {related.categoria}
                      </Badge>
                      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">{related.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{related.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                        <Calendar className="h-3 w-3" />
                        <span>{formatNewsDate(related.data)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
