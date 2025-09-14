import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import curiosidadesData from "@/data/curiosidades.json"

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

export async function generateMetadata({ params }: CuriosidadePageProps) {
  const curiosidade = curiosidadesData.find((c) => c.slug === params.slug)

  if (!curiosidade) {
    return {
      title: "Curiosidade não encontrada",
    }
  }

  return {
    title: `${curiosidade.titulo} | Eventos Históricos`,
    description: curiosidade.descricao.substring(0, 160) + "...",
  }
}

export default function CuriosidadePage({ params }: CuriosidadePageProps) {
  const curiosidade = curiosidadesData.find((c) => c.slug === params.slug)

  if (!curiosidade) {
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
              <p className="text-lg leading-relaxed">{curiosidade.descricao}</p>
            </div>

            {/* Related Curiosities */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-2xl font-bold mb-6">Outras Curiosidades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {curiosidadesData
                  .filter((c) => c.id !== curiosidade.id)
                  .slice(0, 2)
                  .map((related) => (
                    <Link
                      key={related.id}
                      href={`/curiosidades/${related.slug}`}
                      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {related.categoria}
                      </Badge>
                      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.titulo}
                      </h4>
                      <p className="text-sm text-muted-foreground">{related.descricao.substring(0, 120)}...</p>
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
