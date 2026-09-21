import { getAllTimelineEvents, type TimelineEvent } from "@/lib/timeline"

function nameToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export interface Country {
  slug: string
  name: string
  events: TimelineEvent[]
}

let _cache: Country[] | null = null

function buildCountries(): Country[] {
  if (_cache) return _cache

  const map = new Map<string, Country>()
  for (const event of getAllTimelineEvents()) {
    for (const name of event.countries) {
      const slug = nameToSlug(name)
      if (!slug) continue

      const existing = map.get(slug)
      if (existing) {
        existing.events.push(event)
      } else {
        map.set(slug, { slug, name, events: [event] })
      }
    }
  }

  for (const country of map.values()) {
    country.events.sort((a, b) => a.startYear - b.startYear)
  }

  _cache = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  return _cache
}

export function getAllCountries(): Country[] {
  return buildCountries()
}

export function getCountryBySlug(slug: string): Country | undefined {
  return buildCountries().find((c) => c.slug === slug)
}

export function generateCountryStaticParams(): { slug: string }[] {
  return getAllCountries().map((c) => ({ slug: c.slug }))
}

export function getCountriesForEvent(event: TimelineEvent): Country[] {
  return event.countries
    .map((name) => getCountryBySlug(nameToSlug(name)))
    .filter((c): c is Country => Boolean(c))
}
