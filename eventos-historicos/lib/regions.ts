import { getAllTimelineEvents, type TimelineEvent } from "@/lib/timeline"

export interface ContinentDefinition {
  slug: string
  name: string
  description: string
  match: (region: string) => boolean
}

// O campo `region` dos eventos é textual e granular (ex.: "Europa Ocidental",
// "Europa, Ásia e Norte da África", "Mediterrâneo Oriental, Oriente Médio e
// Ásia Central"), então agrupamos por continente/macrorregião checando se o
// texto menciona cada área — um evento pode pertencer a mais de um continente.
const CONTINENTS: ContinentDefinition[] = [
  {
    slug: "europa",
    name: "Europa",
    description: "Impérios, guerras e revoluções que redesenharam o continente europeu.",
    match: (region) => region.includes("Europa"),
  },
  {
    slug: "asia",
    name: "Ásia",
    description: "Dinastias, religiões e impérios que moldaram o continente asiático.",
    match: (region) => region.includes("Ásia"),
  },
  {
    slug: "oriente-medio",
    name: "Oriente Médio",
    description: "Berço de civilizações antigas e palco de conflitos que ecoam até hoje.",
    match: (region) => region.includes("Oriente Médio") || region.includes("Mesopotâmia") || region.includes("Península Arábica"),
  },
  {
    slug: "africa",
    name: "África",
    description: "Das primeiras civilizações ao colonialismo e à descolonização.",
    match: (region) => region.includes("África"),
  },
  {
    slug: "americas",
    name: "Américas",
    description: "Colonização, independências e revoluções no continente americano.",
    match: (region) => region.includes("América"),
  },
  {
    slug: "global",
    name: "Global",
    description: "Eventos e processos que atravessaram fronteiras e mudaram o mundo inteiro.",
    match: (region) => region === "Global",
  },
]

export interface Continent {
  slug: string
  name: string
  description: string
  events: TimelineEvent[]
  countries: string[]
}

let _cache: Continent[] | null = null

function buildContinents(): Continent[] {
  if (_cache) return _cache
  const events = getAllTimelineEvents()

  _cache = CONTINENTS.map((def) => {
    const matched = events
      .filter((event) => def.match(event.region))
      .sort((a, b) => a.startYear - b.startYear)
    const countries = [...new Set(matched.map((e) => e.country))].sort()
    return { slug: def.slug, name: def.name, description: def.description, events: matched, countries }
  }).filter((continent) => continent.events.length > 0)

  return _cache
}

export function getAllContinents(): Continent[] {
  return buildContinents()
}

export function getContinentBySlug(slug: string): Continent | undefined {
  return buildContinents().find((c) => c.slug === slug)
}

export function generateContinentStaticParams(): { slug: string }[] {
  return getAllContinents().map((c) => ({ slug: c.slug }))
}

export function getContinentSlugForRegion(region: string): string | undefined {
  return CONTINENTS.find((def) => def.match(region))?.slug
}
