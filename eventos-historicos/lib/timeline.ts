import timelineData from "@/data/linha-do-tempo.json"
import { existingImage } from "@/lib/public-images"

export interface TimelineCharacter {
  name: string
  role: string
  image?: string
  description?: string
}

export interface TimelineSource {
  title: string
  url: string
  tipo?: "primária" | "secundária" | "académica"
}

export interface TimelineCronologiaItem {
  ano: string
  titulo: string
}

export interface TimelineRelatedContext {
  slug: string
  relacao: string
}

export interface TimelineCoordinates {
  lat: number
  lng: number
}

export interface TimelineEvent {
  id: string
  slug: string
  title: string
  startYear: number
  endYear: number
  dateDisplay: string
  period: string
  region: string
  country: string
  countries: string[]
  coordinates: TimelineCoordinates
  category: string
  summary: string
  content: string
  importance: number
  featured: boolean
  image: string
  relatedEvents: string[]
  relatedEventsContext?: TimelineRelatedContext[]
  characters: TimelineCharacter[]
  sources: TimelineSource[]
  cronologia?: TimelineCronologiaItem[]
  keywords: string[]
}

// Imagens referenciadas no JSON mas ainda ausentes em /public são descartadas aqui,
// na origem, para que todas as páginas derivadas usem seu estado sem imagem.
const events = (timelineData as TimelineEvent[]).map((event) => ({
  ...event,
  image: existingImage(event.image) ?? "",
  characters: event.characters.map((character) => ({
    ...character,
    image: existingImage(character.image),
  })),
}))

export function getAllTimelineEvents(): TimelineEvent[] {
  return events
}

export function getTimelineEventBySlug(slug: string): TimelineEvent | undefined {
  return events.find((event) => event.slug === slug)
}

export function getRelatedTimelineEvents(event: TimelineEvent): TimelineEvent[] {
  return event.relatedEvents
    .map((slug) => getTimelineEventBySlug(slug))
    .filter((related): related is TimelineEvent => Boolean(related))
}

export const TIMELINE_PERIODS = ["Idade Antiga", "Idade Média", "Idade Moderna", "Idade Contemporânea"] as const

export const TIMELINE_CATEGORIES = [...new Set(events.map((event) => event.category))].sort()

export const TIMELINE_REGIONS = [...new Set(events.map((event) => event.region))].sort()

interface TimelineFilters {
  query?: string
  period?: string
  region?: string
  category?: string
  sort?: "asc" | "desc"
}

export function filterTimelineEvents({ query, period, region, category, sort = "asc" }: TimelineFilters): TimelineEvent[] {
  const normalizedQuery = query?.trim().toLowerCase() ?? ""

  const filtered = events.filter((event) => {
    const matchesQuery =
      normalizedQuery === "" ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.summary.toLowerCase().includes(normalizedQuery)
    const matchesPeriod = !period || period === "all" || event.period === period
    const matchesRegion = !region || region === "all" || event.region === region
    const matchesCategory = !category || category === "all" || event.category === category

    return matchesQuery && matchesPeriod && matchesRegion && matchesCategory
  })

  return filtered.sort((a, b) => (sort === "asc" ? a.startYear - b.startYear : b.startYear - a.startYear))
}

export function formatEventYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} a.C.` : `${year}`
}
