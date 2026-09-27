import { getTimelineEventBySlug, formatEventYear, type TimelineEvent } from "@/lib/timeline"

interface EmpireDefinition {
  slug: string
  name: string
  eventSlugs: string[]
}

// Curadoria editorial: impérios reconstruídos a partir de eventos que já
// existem na Linha do Tempo, sem escrever fatos novos (datas, territórios,
// governantes). Ficaram de fora impérios com apenas 1 evento associado que
// já é coberto de forma equivalente em "Guerras" (Bizantino, Macedônico),
// para não duplicar conteúdo sem agregar valor.
const EMPIRES_DEFINITIONS: EmpireDefinition[] = [
  {
    slug: "roma-antiga",
    name: "Roma Antiga",
    eventSlugs: ["fundacao-de-roma", "assassinato-julio-cesar", "queda-imperio-romano-ocidente"],
  },
  {
    slug: "imperio-chines",
    name: "Império Chinês",
    eventSlugs: ["unificacao-china", "revolucao-xinhai"],
  },
  {
    slug: "imperio-mongol",
    name: "Império Mongol",
    eventSlugs: ["fundacao-imperio-mongol"],
  },
  {
    slug: "imperio-do-mali",
    name: "Império do Mali",
    eventSlugs: ["imperio-mali"],
  },
]

export interface Empire {
  slug: string
  name: string
  yearsDisplay: string
  summary: string
  events: TimelineEvent[]
}

let _cache: Empire[] | null = null

function buildEmpires(): Empire[] {
  if (_cache) return _cache

  _cache = EMPIRES_DEFINITIONS.map((def) => {
    const events = def.eventSlugs
      .map((slug) => getTimelineEventBySlug(slug))
      .filter((e): e is TimelineEvent => Boolean(e))
      .sort((a, b) => a.startYear - b.startYear)

    const minYear = Math.min(...events.map((e) => e.startYear))
    const maxYear = Math.max(...events.map((e) => e.endYear))
    const yearsDisplay =
      minYear === maxYear ? formatEventYear(minYear) : `${formatEventYear(minYear)} – ${formatEventYear(maxYear)}`

    const summary =
      events.length === 1
        ? events[0].summary
        : `Trajetória reconstruída a partir de ${events.length} artigos da Linha do Tempo, da fundação à queda.`

    return { slug: def.slug, name: def.name, yearsDisplay, summary, events }
  })

  return _cache
}

export function getAllEmpires(): Empire[] {
  return buildEmpires()
}

export function getEmpireBySlug(slug: string): Empire | undefined {
  return buildEmpires().find((e) => e.slug === slug)
}

export function generateEmpireStaticParams(): { slug: string }[] {
  return getAllEmpires().map((e) => ({ slug: e.slug }))
}

export function getEmpireForEvent(eventSlug: string): Empire | undefined {
  return buildEmpires().find((emp) => emp.events.some((e) => e.slug === eventSlug))
}
