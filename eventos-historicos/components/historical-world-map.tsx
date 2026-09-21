"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, X, ArrowRight } from "lucide-react"
import { toMapPosition } from "@/lib/map-projection"

export interface MapEvent {
  slug: string
  title: string
  summary: string
  dateDisplay: string
  period: string
  category: string
  coordinates: { lat: number; lng: number }
}

const PERIODS = ["Idade Antiga", "Idade Média", "Idade Moderna", "Idade Contemporânea"] as const

const PERIOD_DOT_COLOR: Record<string, string> = {
  "Idade Antiga": "fill-amber-500 text-amber-500",
  "Idade Média": "fill-stone-500 text-stone-500",
  "Idade Moderna": "fill-sky-500 text-sky-500",
  "Idade Contemporânea": "fill-slate-500 text-slate-500",
}

const PERIOD_BADGE: Record<string, string> = {
  "Idade Antiga": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Idade Média": "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  "Idade Moderna": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  "Idade Contemporânea": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

// Vários eventos aconteceram na mesma cidade (ex.: 4 em Roma, 3 em Paris) —
// espalhamos os marcadores que caem quase no mesmo ponto num pequeno círculo
// para que todos continuem visíveis e clicáveis no mapa ilustrativo.
function spreadOverlapping(points: { slug: string; x: number; y: number }[]) {
  const groups = new Map<string, typeof points>()
  for (const p of points) {
    const key = `${p.x.toFixed(1)}:${p.y.toFixed(1)}`
    const group = groups.get(key) ?? []
    group.push(p)
    groups.set(key, group)
  }

  const result = new Map<string, { x: number; y: number }>()
  for (const group of groups.values()) {
    const radius = group.length > 1 ? 1.6 : 0
    group.forEach((p, i) => {
      const angle = (i / group.length) * 2 * Math.PI
      result.set(p.slug, {
        x: p.x + radius * Math.cos(angle),
        y: p.y + radius * Math.sin(angle),
      })
    })
  }
  return result
}

export function HistoricalWorldMap({ events }: { events: MapEvent[] }) {
  const [activePeriods, setActivePeriods] = useState<Set<string>>(new Set(PERIODS))
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = events.filter((e) => activePeriods.has(e.period))

  const positions = useMemo(() => {
    const raw = filtered.map((e) => ({ slug: e.slug, ...toMapPosition(e.coordinates.lat, e.coordinates.lng) }))
    return spreadOverlapping(raw)
  }, [filtered])

  const selectedEvent = filtered.find((e) => e.slug === selected) ?? null

  const togglePeriod = (period: string) => {
    setActivePeriods((prev) => {
      const next = new Set(prev)
      if (next.has(period)) next.delete(period)
      else next.add(period)
      return next.size === 0 ? new Set(PERIODS) : next
    })
    setSelected(null)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {PERIODS.map((period) => {
          const active = activePeriods.has(period)
          return (
            <button
              key={period}
              type="button"
              onClick={() => togglePeriod(period)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? (PERIOD_BADGE[period] ?? "") + " border-transparent"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {period}
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden rounded-3xl border bg-muted/40">
        <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
          <Image
            src="/eventos/world-map.svg"
            alt="Mapa-múndi ilustrativo com os eventos da Linha do Tempo"
            fill
            className="object-contain opacity-90 dark:opacity-70 dark:invert"
          />

          {filtered.map((event) => {
            const pos = positions.get(event.slug)
            if (!pos) return null
            const isSelected = selected === event.slug
            const dotClass = PERIOD_DOT_COLOR[event.period] ?? "fill-primary text-primary"

            return (
              <button
                key={event.slug}
                type="button"
                onClick={() => setSelected(isSelected ? null : event.slug)}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                aria-label={`${event.title} (${event.dateDisplay})`}
              >
                <span
                  className={`absolute -inset-2 rounded-full bg-primary/30 transition-transform duration-300 ${
                    isSelected ? "scale-100" : "scale-0 group-hover:scale-100"
                  }`}
                  aria-hidden
                />
                <MapPin
                  className={`relative h-4 w-4 drop-shadow transition-transform ${dotClass} ${
                    isSelected ? "scale-125" : ""
                  }`}
                />
              </button>
            )
          })}
        </div>

        {selectedEvent ? (
          <div className="border-t bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{selectedEvent.dateDisplay}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PERIOD_BADGE[selectedEvent.period] ?? ""}`}>
                    {selectedEvent.period}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground line-clamp-2">{selectedEvent.summary}</p>
                <Link
                  href={`/linha-do-tempo/${selectedEvent.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ler artigo completo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t bg-card p-4 text-center text-sm text-muted-foreground">
            Toque nos marcadores para explorar {filtered.length} evento{filtered.length !== 1 ? "s" : ""} no mapa
          </div>
        )}
      </div>
    </div>
  )
}
