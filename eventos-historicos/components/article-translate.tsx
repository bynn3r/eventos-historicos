"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NewsImage } from "@/components/news-image"
import { Languages, Loader2, ExternalLink } from "lucide-react"

interface ArticleTranslateProps {
  idiomaOriginal: "pt" | "en"
  titulo: string
  descricao: string
  conteudo: string
  noticeHtml: string
  linkFonte?: string
  imagem?: string
  imageCaption: string
}

interface TranslatedState {
  titulo: string
  descricao: string
  paragrafos: string[]
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
  noticeHtml,
  linkFonte,
  imagem,
  imageCaption,
}: ArticleTranslateProps) {
  const [translated, setTranslated] = useState<TranslatedState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const paragrafosOriginais = paragraphsFrom(conteudo)
  const showingTranslated = translated !== null

  async function handleTranslate() {
    if (showingTranslated) {
      setTranslated(null)
      return
    }

    setLoading(true)
    setError(false)

    try {
      const response = await fetch("/api/traduzir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [titulo, descricao, ...paragrafosOriginais] }),
      })

      if (!response.ok) {
        throw new Error("Falha ao traduzir")
      }

      const data = (await response.json()) as { texts: string[] }
      const [translatedTitulo, translatedDescricao, ...translatedParagrafos] = data.texts

      setTranslated({
        titulo: translatedTitulo,
        descricao: translatedDescricao,
        paragrafos: translatedParagrafos,
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const displayTitulo = showingTranslated ? translated.titulo : titulo
  const displayDescricao = showingTranslated ? translated.descricao : descricao
  const displayParagrafos = showingTranslated ? translated.paragrafos : paragrafosOriginais

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

        {idiomaOriginal === "en" && (
          <Button variant="outline" size="sm" onClick={handleTranslate} disabled={loading} className="rounded-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
            {showingTranslated ? "Ver original em inglês" : "Traduzir para português"}
          </Button>
        )}
      </div>

      {idiomaOriginal === "en" && error && (
        <p className="mt-2 text-sm text-destructive">Não foi possível traduzir agora. Tente de novo.</p>
      )}

      {imagem && (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted">
            <NewsImage src={imagem} alt={displayTitulo} fill className="object-cover" />
          </div>
          <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{imageCaption}</figcaption>
        </figure>
      )}

      <div className="mt-10 max-w-[820px]">
        <div
          className="prose prose-neutral max-w-none prose-headings:scroll-mt-24 prose-p:mb-6 prose-p:text-[1.06rem] prose-p:leading-8 prose-li:leading-8 prose-strong:text-foreground prose-a:text-primary"
        >
          {displayParagrafos.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {noticeHtml && <div dangerouslySetInnerHTML={{ __html: noticeHtml }} />}
        </div>
      </div>
    </div>
  )
}
