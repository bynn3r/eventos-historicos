"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Filter, MapPin, Users, Zap, Globe, Crown, Sword, BookOpen, ArrowUpDown } from "lucide-react"
import {
  getAllTimelineEvents,
  filterTimelineEvents,
  TIMELINE_PERIODS,
  TIMELINE_CATEGORIES,
  TIMELINE_REGIONS,
  type TimelineEvent,
} from "@/lib/timeline"

// Icon/color are presentation-only, so they live here (not in the JSON data)
// keyed by slug — a small lookup instead of one entry per event keeps the
// content file free of React references.
const EVENT_VISUALS: Record<string, { icon: any; color: string }> = {
  "unificacao-egito": { icon: Crown, color: "bg-yellow-500" },
  "primeiros-jogos-olimpicos": { icon: Users, color: "bg-blue-500" },
  "fundacao-de-roma": { icon: Sword, color: "bg-red-500" },
  "unificacao-china": { icon: Crown, color: "bg-yellow-500" },
  "queda-imperio-romano-ocidente": { icon: Sword, color: "bg-red-500" },
  "queda-constantinopla": { icon: Sword, color: "bg-red-500" },
  "descobrimento-america": { icon: Globe, color: "bg-green-500" },
  "revolucao-francesa": { icon: Users, color: "bg-blue-500" },
  "fim-segunda-guerra-mundial": { icon: Sword, color: "bg-red-500" },
  "chegada-homem-lua": { icon: Zap, color: "bg-purple-500" },
  "queda-muro-berlim": { icon: Users, color: "bg-blue-500" },
  "independencia-brasil": { icon: Globe, color: "bg-green-500" },
  "primeira-guerra-mundial": { icon: Sword, color: "bg-red-500" },
  "revolucao-russa": { icon: Users, color: "bg-blue-500" },
}
const DEFAULT_VISUAL = { icon: BookOpen, color: "bg-slate-500" }

function getVisual(slug: string) {
  return EVENT_VISUALS[slug] ?? DEFAULT_VISUAL
}

function EventDialogContent({ event }: { event: TimelineEvent }) {
  const { icon: IconComponent, color } = getVisual(event.slug)

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-lg`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`${color} text-white`}>{event.dateDisplay}</Badge>
              <Badge variant="secondary">{event.category}</Badge>
              <Badge variant="outline">{event.region}</Badge>
            </div>
          </div>
        </div>
      </DialogHeader>
      <DialogDescription className="text-base leading-relaxed">{event.summary}</DialogDescription>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/linha-do-tempo/${event.slug}`}>Ver artigo completo</Link>
        </Button>
        {event.featured && (
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/evento/${event.slug}`}>Explorar experiência completa</Link>
          </Button>
        )}
      </div>
    </DialogContent>
  )
}

function TimelineEventItem({ event, index }: { event: TimelineEvent; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { icon: IconComponent, color } = getVisual(event.slug)
  const isLeft = index % 2 === 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="timeline-item relative grid grid-cols-[auto_1fr] md:grid-cols-[1fr_40px_1fr] items-start md:items-center gap-x-6 md:gap-x-0"
    >
      {/* Icon — mobile: col 1; desktop: always center column */}
      <div className="md:col-start-2 md:row-start-1 flex items-center justify-center">
        <div
          className={`timeline-dot w-8 h-8 md:w-10 md:h-10 ${color} rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10`}
        >
          <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-white" />
        </div>
      </div>

      {/* Card — mobile: col 2; desktop: col 1 (even) or col 3 (odd) */}
      <div
        className={[
          "flex flex-col pb-8 md:pb-0 md:row-start-1",
          isLeft ? "md:col-start-1 md:items-end md:pr-8" : "md:col-start-3 md:pl-8",
        ].join(" ")}
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Card className="w-full md:max-w-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className={`flex items-center gap-2 mb-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                  <Badge className={`${color} text-white font-semibold`}>{event.dateDisplay}</Badge>
                  <Badge variant="secondary">{event.category}</Badge>
                </div>
                <CardTitle className={`text-xl leading-tight ${isLeft ? "md:text-right" : ""}`}>
                  {event.title}
                </CardTitle>
                <CardDescription className={`text-base leading-relaxed ${isLeft ? "md:text-right" : ""}`}>
                  {event.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isLeft ? "md:flex-row-reverse" : ""}`}>
                  <MapPin className="h-4 w-4" />
                  <span>{event.region}</span>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          {open && <EventDialogContent event={event} />}
        </Dialog>
        {/* Links rastreáveis por crawlers — abaixo do card, empilhados verticalmente */}
        <div className={`flex gap-4 px-1 pt-2 text-xs w-full md:max-w-md ${isLeft ? "md:justify-end" : ""}`}>
          <Link
            href={`/linha-do-tempo/${event.slug}`}
            className="text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
          >
            Artigo completo
          </Link>
          {event.featured && (
            <Link
              href={`/evento/${event.slug}`}
              className="text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
            >
              Explorar evento
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LinhaDoTempoPage() {
  const allEvents = useMemo(() => getAllTimelineEvents(), [])

  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const filteredEvents = filterTimelineEvents({
    query: searchTerm,
    category: selectedCategory,
    region: selectedRegion,
    period: selectedPeriod,
    sort: sortOrder,
  })

  // Scroll-linked timeline line
  const lineDesktopRef = useRef<HTMLDivElement>(null)
  const lineMobileRef = useRef<HTMLDivElement>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const updateLineRef = useRef<() => void>(() => {})

  useEffect(() => {
    const update = () => {
      const line = lineDesktopRef.current
      const container = timelineContainerRef.current
      if (!line || !container) return
      const rect = container.getBoundingClientRect()
      const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.55 - rect.top) / rect.height))
      line.style.transform = `scaleY(${progress})`
    }
    updateLineRef.current = update

    // Reveal lines
    lineDesktopRef.current?.classList.add("is-ready")
    lineMobileRef.current?.classList.add("is-ready")

    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => window.removeEventListener("scroll", update)
  }, [])

  // Recalculate when filters change (container height changes)
  useEffect(() => {
    updateLineRef.current()
  }, [filteredEvents])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Linha do Tempo Interativa</h1>
              <p className="text-xl text-muted-foreground">
                Explore os eventos mais importantes da história mundial de forma cronológica e interativa
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b bg-background sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    {TIMELINE_PERIODS.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {TIMELINE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[150px]">
                    <MapPin className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {TIMELINE_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "asc" ? "Mais antigos" : "Mais recentes"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div ref={timelineContainerRef} className="relative max-w-6xl mx-auto">
              {/* Timeline Line - Hidden on mobile, visible on desktop */}
              <div
                ref={lineDesktopRef}
                className="timeline-line-desktop hidden md:block absolute left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary/20 via-primary to-primary/20"
              />

              {/* Mobile Timeline Line */}
              <div
                ref={lineMobileRef}
                className="timeline-line-mobile md:hidden absolute left-4 top-0 w-1 h-full bg-gradient-to-b from-primary/20 via-primary/20 to-primary/20"
              />

              {/* Single DOM tree per event — no duplication for crawlers.
                  Mobile: 2-col grid [icon | card].
                  Desktop: 3-col grid [left(1fr) | center(40px) | right(1fr)].
                  Card placed in col-1 (even) or col-3 (odd) via md:col-start-*. */}
              <div className="space-y-8 md:space-y-16">
                {filteredEvents.map((event, index) => (
                  <TimelineEventItem key={event.id} event={event} index={index} />
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou termo de busca para encontrar eventos históricos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Explore a História</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nossa linha do tempo cobre mais de 5000 anos de história mundial, desde as primeiras civilizações até os
                eventos contemporâneos.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                <div className="text-sm text-muted-foreground">Anos de História</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent-foreground mb-2">{allEvents.length}</div>
                <div className="text-sm text-muted-foreground">Eventos Principais</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-destructive mb-2">{TIMELINE_REGIONS.length}</div>
                <div className="text-sm text-muted-foreground">Regiões Cobertas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{TIMELINE_CATEGORIES.length}</div>
                <div className="text-sm text-muted-foreground">Categorias</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
