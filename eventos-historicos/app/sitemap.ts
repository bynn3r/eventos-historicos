import type { MetadataRoute } from "next"
import grandesEventosData from "@/data/grandes-eventos.json"
import curiosidadesData from "@/data/curiosidades.json"
import { getAllTimelineEvents } from "@/lib/timeline"

const SITE_URL = "https://eventoshistoricos.com.br"

export default function sitemap(): MetadataRoute.Sitemap {
  const timelineEvents = getAllTimelineEvents()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/linha-do-tempo`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/grandes-eventos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/curiosidades`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/noticias`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/sobre`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contato`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ]

  const timelineRoutes: MetadataRoute.Sitemap = timelineEvents.map((event) => ({
    url: `${SITE_URL}/linha-do-tempo/${event.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const eventoRoutes: MetadataRoute.Sitemap = (grandesEventosData as { slug: string }[]).map((evento) => ({
    url: `${SITE_URL}/evento/${evento.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const curiosidadeRoutes: MetadataRoute.Sitemap = (curiosidadesData as { slug: string }[]).map((c) => ({
    url: `${SITE_URL}/curiosidades/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticRoutes, ...timelineRoutes, ...eventoRoutes, ...curiosidadeRoutes]
}
