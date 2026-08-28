"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NewsImage } from "@/components/news-image"
import { ArticleTranslate } from "@/components/article-translate"
import { Calendar, ArrowLeft, ExternalLink, User, Landmark } from "lucide-react"
import Link from "next/link"
import { formatNewsDate, renderSafeArticleHtml, type SiteNewsArticle } from "@/lib/news"
import type { RelatedContentItem } from "@/lib/related-content"

interface ArticlePageRuntimeProps {
  noticia: SiteNewsArticle
  relatedNews: SiteNewsArticle[]
  relatedHistorical?: RelatedContentItem[]
}

export function ArticlePageRuntime({ noticia, relatedNews, relatedHistorical = [] }: ArticlePageRuntimeProps) {
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

              {noticia.tipo === "rss" ? (
                <ArticleTranslate
                  idiomaOriginal={noticia.idioma}
                  titulo={noticia.titulo}
                  descricao={noticia.descricao}
                  conteudo={noticia.conteudo}
                  tituloOriginal={noticia.tituloOriginal}
                  descricaoOriginal={noticia.descricaoOriginal}
                  conteudoOriginal={noticia.conteudoOriginal}
                  noticeHtml={noticia.noticeHtml}
                  linkFonte={noticia.linkFonte}
                  imagem={noticia.imagem}
                  imageCaption={imageCaption}
                />
              ) : (
                <>
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
                    {noticia.titulo}
                  </h1>

                  {noticia.descricao && (
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{noticia.descricao}</p>
                  )}

                  {noticia.imagem && (
                    <figure className="mt-8">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted">
                        <NewsImage src={noticia.imagem} alt={noticia.titulo} fill className="object-cover" />
                      </div>
                      <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{imageCaption}</figcaption>
                    </figure>
                  )}

                  <div className="mt-10 max-w-[820px]">
                    <div
                      className="prose prose-neutral max-w-none prose-headings:scroll-mt-24 prose-p:mb-6 prose-p:text-[1.06rem] prose-p:leading-8 prose-li:leading-8 prose-strong:text-foreground prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  </div>
                </>
              )}

              <div className="mt-10 max-w-[820px]">
                <div className="space-y-8">
                  <section className="rounded-2xl border bg-card p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h2 className="text-base font-semibold text-foreground">Fonte</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {noticia.fonte}. O Eventos Historicos organiza este conteudo com base na publicacao original.
                        </p>
                      </div>

                      {noticia.tipo === "rss" && noticia.linkFonte && (
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

                  {relatedHistorical.length > 0 && (
                    <section className="rounded-2xl border bg-card p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">Contexto histórico</h2>
                      </div>
                      <p className="mb-5 text-sm text-muted-foreground">
                        Isso já aconteceu antes — explore o pano de fundo histórico por trás dessa notícia.
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {relatedHistorical.map((item) => (
                          <Link
                            key={`${item.type}-${item.slug}`}
                            href={item.href}
                            className="group rounded-xl border bg-background p-4 transition-shadow hover:shadow-lg"
                          >
                            <Badge variant="outline" className="mb-2 text-xs">
                              {item.type === "evento" ? "Linha do Tempo" : "Curiosidade"}
                            </Badge>
                            <h3 className="mb-1 text-sm font-semibold leading-6 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{item.summary}</p>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
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
