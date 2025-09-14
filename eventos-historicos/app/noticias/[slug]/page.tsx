import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Share2, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import noticiasData from "@/data/noticias.json"

interface NoticiaPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return noticiasData.map((noticia) => ({
    slug: noticia.slug,
  }))
}

export async function generateMetadata({ params }: NoticiaPageProps) {
  const noticia = noticiasData.find((n) => n.slug === params.slug)

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

export default function NoticiaPage({ params }: NoticiaPageProps) {
  const noticia = noticiasData.find((n) => n.slug === params.slug)

  if (!noticia) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar às Notícias
                </Link>
              </Button>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(noticia.data).toLocaleDateString("pt-BR")}</span>
                </div>
                <Badge variant="secondary">{noticia.categoria}</Badge>
                {noticia.autor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{noticia.autor}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-balance mb-6">{noticia.titulo}</h1>

              <div className="flex items-center justify-between">
                <p className="text-xl text-muted-foreground text-pretty max-w-3xl">{noticia.descricao}</p>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            {noticia.imagem && (
              <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
                <Image src={noticia.imagem || "/placeholder.svg"} alt={noticia.titulo} fill className="object-cover" />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-lg leading-relaxed">{noticia.conteudo}</p>
            </div>

            {/* Source and Tags */}
            <div className="border-t pt-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {noticia.fonte && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Fonte:</span>
                    {noticia.linkFonte ? (
                      <Link
                        href={noticia.linkFonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        {noticia.fonte}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span>{noticia.fonte}</span>
                    )}
                  </div>
                )}

                {noticia.tags && (
                  <div className="flex flex-wrap gap-2">
                    {noticia.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Related News */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-2xl font-bold mb-6">Notícias Relacionadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {noticiasData
                  .filter((n) => n.id !== noticia.id)
                  .slice(0, 2)
                  .map((related) => (
                    <Link
                      key={related.id}
                      href={`/noticias/${related.slug}`}
                      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {related.categoria}
                      </Badge>
                      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.titulo}
                      </h4>
                      <p className="text-sm text-muted-foreground">{related.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(related.data).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
