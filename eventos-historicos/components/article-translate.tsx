"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NewsImage } from "@/components/news-image"
import { Languages, ExternalLink } from "lucide-react"

interface ArticleTranslateProps {
  idiomaOriginal: "pt" | "en"
  titulo: string
  descricao: string
  conteudo: string
  tituloOriginal?: string
  descricaoOriginal?: string
  conteudoOriginal?: string
  noticeHtml: string
  linkFonte?: string
  imagem?: string
  imageCaption: string
}

function paragraphsFrom(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function ArticleTranslate({
  idiomaOriginal,
  titulo,
  descricao,
  conteudo,
  tituloOriginal,
  descricaoOriginal,
  conteudoOriginal,
  noticeHtml,
  linkFonte,
  imagem,
  imageCaption,
}: ArticleTranslateProps) {
  const hasOriginal = idiomaOriginal === "en" && Boolean(tituloOriginal || descricaoOriginal || conteudoOriginal)
  const [showingOriginal, setShowingOriginal] = useState(false)

  const displayTitulo = showingOriginal ? tituloOriginal || titulo : titulo
  const displayDescricao = showingOriginal ? descricaoOriginal || descricao : descricao
  const displayParagrafos = paragraphsFrom(showingOriginal ? conteudoOriginal || conteudo : conteudo)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
          {displayTitulo}
        </h1>
      </div>

      {displayDescricao && (
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{displayDescricao}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {linkFonte && (
          <Button variant="outline" asChild className="rounded-full px-5">
            <a href={linkFonte} target="_blank" rel="noopener noreferrer">
              Ver noticia completa no site original
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}

        {hasOriginal && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowingOriginal((current) => !current)}
            className="rounded-full"
          >
            <Languages className="mr-2 h-4 w-4" />
            {showingOriginal ? "Ver tradução em português" : "Ver original em inglês"}
          </Button>
        )}
      </div>

      {imagem && (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted">
            <NewsImage src={imagem} alt={displayTitulo} fill className="object-cover" />
          </div>
          <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{imageCaption}</figcaption>
        </figure>
      )}

      <div className="mt-10 max-w-[820px]">
        <div className="prose prose-neutral max-w-none prose-headings:scroll-mt-24 prose-a:text-primary">
          {displayParagrafos.map((paragraph, index) => (
            <p key={index} className="mb-6 text-[1.06rem] leading-8 last:mb-0">
              {paragraph}
            </p>
          ))}
          {noticeHtml && <div className="mt-6" dangerouslySetInnerHTML={{ __html: noticeHtml }} />}
        </div>
      </div>
    </div>
  )
}
