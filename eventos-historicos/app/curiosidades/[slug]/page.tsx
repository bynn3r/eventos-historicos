import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Share2, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import curiosidadesData from "@/data/curiosidades.json"
import { findRelatedContent } from "@/lib/related-content"

interface CuriosidadePageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return curiosidadesData.map((curiosidade) => ({
    slug: curiosidade.slug,
  }))
}

const SITE_URL = "https://eventoshistoricos.com.br"

export async function generateMetadata({ params }: CuriosidadePageProps) {
  const curiosidade = curiosidadesData.find((c) => c.slug === params.slug)

  if (!curiosidade) {
    return { title: "Curiosidade não encontrada" }
  }

  const description =
    curiosidade.descricao.length > 160 ? `${curiosidade.descricao.substring(0, 157)}...` : curiosidade.descricao
  const url = `${SITE_URL}/curiosidades/${curiosidade.slug}`

  return {
    title: `${curiosidade.titulo} | Eventos Históricos`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: curiosidade.titulo,
      description,
      type: "article",
      locale: "pt_BR",
      url,
      images: curiosidade.imagem ? [{ url: `${SITE_URL}${curiosidade.imagem}`, alt: curiosidade.titulo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: curiosidade.titulo,
      description,
      images: curiosidade.imagem ? [`${SITE_URL}${curiosidade.imagem}`] : undefined,
    },
  }
}

export default function CuriosidadePage({ params }: CuriosidadePageProps) {
  const curiosidade = curiosidadesData.find((c) => c.slug === params.slug)

  if (!curiosidade) {
    notFound()
  }

  const relatedContent = findRelatedContent(`${curiosidade.titulo} ${curiosidade.descricao}`, {
    category: curiosidade.categoria,
    excludeSlug: curiosidade.slug,
    limit: 4,
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: curiosidade.titulo,
    description: curiosidade.descricao,
    image: curiosidade.imagem ? `${SITE_URL}${curiosidade.imagem}` : undefined,
    url: `${SITE_URL}/curiosidades/${curiosidade.slug}`,
    datePublished: curiosidade.data,
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: "Eventos Históricos",
      url: SITE_URL,
    },
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />

      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                <li><Link href="/" className="hover:text-foreground transition-colors">Início</Link></li>
                <li><ChevronRight className="h-3.5 w-3.5" /></li>
                <li><Link href="/curiosidades" className="hover:text-foreground transition-colors">Curiosidades</Link></li>
                <li><ChevronRight className="h-3.5 w-3.5" /></li>
                <li className="text-foreground font-medium line-clamp-1">{curiosidade.titulo}</li>
              </ol>
            </nav>

            {/* Header */}
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/curiosidades">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar às Curiosidades
                </Link>
              </Button>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(curiosidade.data).toLocaleDateString("pt-BR")}</span>
                </div>
                <Badge variant="secondary">{curiosidade.categoria}</Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-balance mb-6">{curiosidade.titulo}</h1>

              <div className="flex items-center justify-between">
                <p className="text-xl text-muted-foreground text-pretty max-w-3xl">
                  {curiosidade.descricao.split(".")[0]}.
                </p>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            {curiosidade.imagem && (
              <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
                <Image
                  src={curiosidade.imagem || "/placeholder.svg"}
                  alt={curiosidade.titulo}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {(curiosidade.conteudo ?? curiosidade.descricao)
                .split(/\n\s*\n/)
                .map((paragraph, index) => (
                  <p key={index} className="mb-6 text-lg leading-relaxed last:mb-0">
                    {paragraph}
                  </p>
                ))}
            </div>

            {/* Related content */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-2xl font-bold mb-6">Continue explorando</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(relatedContent.length > 0
                  ? relatedContent
                  : curiosidadesData
                      .filter((c) => c.id !== curiosidade.id)
                      .slice(0, 2)
                      .map((c) => ({
                        type: "curiosidade" as const,
                        slug: c.slug,
                        title: c.titulo,
                        summary: c.descricao,
                        href: `/curiosidades/${c.slug}`,
                        category: c.categoria,
                      }))
                ).map((related) => (
                  <Link
                    key={`${related.type}-${related.slug}`}
                    href={related.href}
                    className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {related.type === "evento" ? "Linha do Tempo" : "Curiosidade"}
                      </Badge>
                      <Badge variant="secondary">{related.category}</Badge>
                    </div>
                    <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{related.summary.substring(0, 120)}...</p>
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
