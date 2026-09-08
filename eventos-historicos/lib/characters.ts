import { getAllTimelineEvents, type TimelineEvent } from "@/lib/timeline"

export interface CharacterEvent {
  slug: string
  title: string
  period: string
  dateDisplay: string
  startYear: number
  category: string
}

export interface Character {
  slug: string
  name: string
  role: string
  image: string
  description: string
  events: CharacterEvent[]
}

function nameToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

let _cache: Map<string, Character> | null = null

function buildCharacterMap(): Map<string, Character> {
  if (_cache) return _cache
  const map = new Map<string, Character>()
  const events = getAllTimelineEvents()

  for (const event of events) {
    const eventRef: CharacterEvent = {
      slug: event.slug,
      title: event.title,
      period: event.period,
      dateDisplay: event.dateDisplay,
      startYear: event.startYear,
      category: event.category,
    }

    for (const char of event.characters) {
      const slug = nameToSlug(char.name)
      if (!slug) continue

      const existing = map.get(slug)
      if (existing) {
        existing.events.push(eventRef)
        if (!existing.image && char.image) existing.image = char.image
        if (!existing.description && char.description) existing.description = char.description
      } else {
        map.set(slug, {
          slug,
          name: char.name,
          role: char.role,
          image: char.image ?? "",
          description: char.description ?? "",
          events: [eventRef],
        })
      }
    }
  }

  _cache = map
  return map
}

export function getAllCharacters(): Character[] {
  const map = buildCharacterMap()
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  )
}

export function getCharacterBySlug(slug: string): Character | undefined {
  return buildCharacterMap().get(slug)
}

export function generateCharacterStaticParams(): { slug: string }[] {
  return getAllCharacters().map((c) => ({ slug: c.slug }))
}
