import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { formatNewsDate, getNewsArticleBySlug, getRelatedNews, renderSafeArticleHtml } from "@/lib/news"

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
  const safeHtml = renderSafeArticleHtml(noticia.conteudoHtml)
  const imageCaption = noticia.tipo === "rss" ? `Imagem da cobertura original via ${noticia.fonte}.` : `Imagem de destaque da análise ${noticia.fonte}.`

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <article className="py-10 md:py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-4xl">
              <Button variant="ghost" asChild className="mb-6 pl-0 text-muted-foreground hover:text-foreground">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar às Notícias
                </Link>
              </Button>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatNewsDate(noticia.data)}</span>
                </div>
                <Badge variant="secondary">{noticia.categoria}</Badge>
                <Badge variant="outline">{noticia.tipo === "rss" ? "Agregador RSS" : "Análise do portal"}</Badge>
                {noticia.resumo && <Badge variant="outline">Resumo editorial</Badge>}
                {noticia.autor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{noticia.autor}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-5">
                {noticia.titulo}
              </h1>

              {noticia.descricao && (
                <p className="max-w-3xl text-lg md:text-xl leading-8 text-muted-foreground mb-6">{noticia.descricao}</p>
              )}

              {noticia.linkFonte && (
                <Button variant="outline" asChild className="rounded-full px-5">
                  <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                    Ver notícia completa no site original
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,860px)_280px] lg:items-start">
              <div className="min-w-0">
                {noticia.imagem && (
                  <figure className="mb-8">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-muted">
                      <Image src={noticia.imagem || "/placeholder.svg"} alt={noticia.titulo} fill className="object-cover" />
                    </div>
                    <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{imageCaption}</figcaption>
                  </figure>
                )}

                <div className="mx-auto max-w-prose">
                  <div
                    className="prose prose-neutral max-w-none prose-headings:scroll-mt-24 prose-p:mb-6 prose-p:leading-8 prose-p:text-[1.05rem] prose-li:leading-8 prose-strong:text-foreground prose-a:text-primary"
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                  />
                </div>

                {noticia.tipo === "rss" && (
                  <div className="mx-auto mt-10 max-w-prose rounded-2xl border bg-muted/40 p-6">
                    <h2 className="text-base font-semibold mb-2">Crédito editorial</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Fonte: <span className="font-medium text-foreground">{noticia.fonte}</span>. O Eventos Históricos
                      organiza este conteúdo a partir do feed oficial e mantém acesso para a publicação original.
                    </p>
                  </div>
                )}
              </div>

              <aside className="lg:sticky lg:top-24 space-y-5">
                <div className="rounded-2xl border bg-card p-5">
                  <h2 className="text-base font-semibold mb-3">Fonte</h2>
                  <p className="text-sm leading-6 text-muted-foreground mb-4">
                    Fonte: <span className="font-medium text-foreground">{noticia.fonte}</span>
                  </p>
                  {noticia.linkFonte && (
                    <Button variant="outline" asChild className="w-full justify-between">
                      <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                        Ver notícia completa no site original
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {noticia.tags.length > 0 && (
                  <div className="rounded-2xl border bg-card p-5">
                    <h2 className="text-base font-semibold mb-3">Tags</h2>
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
              <div className="mx-auto mt-16 max-w-6xl border-t pt-10">
                <div className="mx-auto max-w-4xl">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6">Notícias Relacionadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedNews.map((related) => (
                      <Link
                        key={related.id}
                        href={related.href}
                        className="group rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
                      >
                        <Badge variant="secondary" className="mb-3">
                          {related.categoria}
                        </Badge>
                        <h4 className="font-semibold text-lg leading-7 mb-2 group-hover:text-primary transition-colors">
                          {related.titulo}
                        </h4>
                        <p className="text-sm leading-6 text-muted-foreground">{related.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                          <Calendar className="h-3 w-3" />
                          <span>{formatNewsDate(related.data)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
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
