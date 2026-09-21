import { getTimelineEventBySlug, formatEventYear, type TimelineEvent } from "@/lib/timeline"

interface WarDefinition {
  slug: string
  name: string
  eventSlugs: string[]
}

// Curadoria editorial: quais dos 51 eventos da Linha do Tempo são conflitos
// armados e como se agrupam em guerras. Alguns conflitos têm mais de um
// evento associado (a Segunda Guerra Mundial tem artigo de início e de fim);
// a maioria tem só um. Não inventamos fatos novos — a página de guerra
// apenas reorganiza o conteúdo já existente nos eventos.
const WARS_DEFINITIONS: WarDefinition[] = [
  {
    slug: "segunda-guerra-mundial",
    name: "Segunda Guerra Mundial",
    eventSlugs: ["inicio-segunda-guerra-mundial", "fim-segunda-guerra-mundial"],
  },
  {
    slug: "primeira-guerra-mundial",
    name: "Primeira Guerra Mundial",
    eventSlugs: ["primeira-guerra-mundial"],
  },
  {
    slug: "guerras-napoleonicas",
    name: "Guerras Napoleônicas",
    eventSlugs: ["guerras-napoleonicas"],
  },
  {
    slug: "guerra-dos-cem-anos",
    name: "Guerra dos Cem Anos",
    eventSlugs: ["guerra-dos-cem-anos"],
  },
  {
    slug: "primeira-cruzada",
    name: "Primeira Cruzada",
    eventSlugs: ["primeira-cruzada"],
  },
  {
    slug: "conquistas-de-alexandre",
    name: "Conquistas de Alexandre, o Grande",
    eventSlugs: ["conquistas-alexandre-grande"],
  },
  {
    slug: "queda-de-constantinopla",
    name: "Queda de Constantinopla",
    eventSlugs: ["queda-constantinopla"],
  },
  {
    slug: "conquistas-mongois",
    name: "Conquistas Mongóis",
    eventSlugs: ["fundacao-imperio-mongol"],
  },
]

export interface War {
  slug: string
  name: string
  yearsDisplay: string
  summary: string
  events: TimelineEvent[]
}

let _cache: War[] | null = null

function buildWars(): War[] {
  if (_cache) return _cache

  _cache = WARS_DEFINITIONS.map((def) => {
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
        : `Conflito reconstruído a partir de ${events.length} artigos da Linha do Tempo, do início ao fim.`

    return { slug: def.slug, name: def.name, yearsDisplay, summary, events }
  })

  return _cache
}

export function getAllWars(): War[] {
  return buildWars()
}

export function getWarBySlug(slug: string): War | undefined {
  return buildWars().find((w) => w.slug === slug)
}

export function generateWarStaticParams(): { slug: string }[] {
  return getAllWars().map((w) => ({ slug: w.slug }))
}

export function getWarForEvent(eventSlug: string): War | undefined {
  return buildWars().find((w) => w.events.some((e) => e.slug === eventSlug))
}
