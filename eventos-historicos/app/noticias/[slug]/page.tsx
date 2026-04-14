import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NewsImage } from "@/components/news-image"
import { Calendar, ArrowLeft, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { generateExpandedContent } from "@/lib/news-editorial"
import { formatNewsDate, getNewsArticleBySlug, getRelatedNews, renderSafeArticleHtml } from "@/lib/news"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

function renderTextParagraphs(text: string) {
  return text.split(/\n\s*\n/).filter(Boolean)
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const noticia = await getNewsArticleBySlug(params.slug)

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

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const noticia = await getNewsArticleBySlug(params.slug)

  if (!noticia) {
    notFound()
  }

  const relatedNews = await getRelatedNews(params.slug, 2)
  const shouldUseEditorialExpansion = noticia.tipo === "rss" && noticia.resumo
  const expandedEditorial =
    shouldUseEditorialExpansion
      ? await generateExpandedContent(
          noticia,
          relatedNews.map((related) => ({
            titulo: related.titulo,
            descricao: related.descricao,
            fonte: related.fonte,
            categoria: related.categoria,
          })),
        )
      : null

  const displayTitle = expandedEditorial?.titlePt || noticia.titulo
  const displaySubtitle = expandedEditorial?.subtitlePt || noticia.descricao
  const displayContent = expandedEditorial?.contentPt || ""
  const displayHistoricalContext = expandedEditorial?.historicalContextPt
  const editorialNote = expandedEditorial?.editorialNotePt
  const safeHtml = renderSafeArticleHtml(noticia.conteudoHtml)
  const imageCaption =
    noticia.tipo === "rss"
      ? `Imagem de referencia da cobertura publicada por ${noticia.fonte}.`
      : `Imagem de destaque da analise publicada por ${noticia.fonte}.`

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-background">
        <article className="py-10 md:py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[920px]">
              <Button variant="ghost" asChild className="mb-6 pl-0 text-muted-foreground hover:text-foreground">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar as noticias
                </Link>
              </Button>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary">{noticia.categoria}</Badge>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatNewsDate(noticia.data)}</span>
                </div>
                {noticia.autor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{noticia.autor}</span>
                  </div>
                )}
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
                {displayTitle}
              </h1>

              {displaySubtitle && (
                <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{displaySubtitle}</p>
              )}

              {noticia.linkFonte && (
                <div className="mt-6">
                  <Button variant="outline" asChild className="rounded-full px-5">
                    <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                      Ver noticia completa no site original
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              {noticia.imagem && (
                <figure className="mt-8">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted">
                    <NewsImage src={noticia.imagem} alt={displayTitle} fill className="object-cover" />
                  </div>
                  <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{imageCaption}</figcaption>
                </figure>
              )}

              <div className="mt-10 max-w-[820px]">
                {expandedEditorial ? (
                  <div className="space-y-10">
                    <div className="prose prose-neutral max-w-none prose-p:mb-6 prose-p:text-[1.06rem] prose-p:leading-8">
                      {renderTextParagraphs(displayContent).map((paragraph, index) => (
                        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                      ))}
                    </div>

                    {displayHistoricalContext && (
                      <section className="rounded-2xl border bg-muted/20 p-6">
                        <h2 className="text-lg font-semibold text-foreground">Contexto historico</h2>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                          {renderTextParagraphs(displayHistoricalContext).map((paragraph, index) => (
                            <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border bg-card p-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h2 className="text-base font-semibold text-foreground">Fonte</h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {noticia.fonte}. O Eventos Historicos organiza este conteudo com base na publicacao original.
                          </p>
                        </div>

                        {noticia.linkFonte && (
                          <Button variant="outline" asChild className="md:min-w-[240px] md:justify-between">
                            <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                              Ver noticia completa no site original
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {noticia.tags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {noticia.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </section>

                    {editorialNote && (
                      <p className="text-sm leading-6 text-muted-foreground">{editorialNote}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div
                      className="prose prose-neutral max-w-none prose-headings:scroll-mt-24 prose-p:mb-6 prose-p:text-[1.06rem] prose-p:leading-8 prose-li:leading-8 prose-strong:text-foreground prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />

                    <section className="rounded-2xl border bg-card p-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h2 className="text-base font-semibold text-foreground">Fonte</h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {noticia.fonte}. O Eventos Historicos organiza este conteudo com base na publicacao original.
                          </p>
                        </div>

                        {noticia.linkFonte && (
                          <Button variant="outline" asChild className="md:min-w-[240px] md:justify-between">
                            <a href={noticia.linkFonte} target="_blank" rel="noopener noreferrer">
                              Ver noticia completa no site original
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {noticia.tags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {noticia.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </div>

            {relatedNews.length > 0 && (
              <div className="mx-auto mt-16 max-w-[920px] border-t pt-10">
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">Noticias relacionadas</h3>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {relatedNews.map((related) => (
                    <Link
                      key={related.id}
                      href={related.href}
                      className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {related.categoria}
                      </Badge>
                      <h4 className="mb-2 text-lg font-semibold leading-7 group-hover:text-primary transition-colors">
                        {related.titulo}
                      </h4>
                      <p className="text-sm leading-6 text-muted-foreground">{related.descricao}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
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
