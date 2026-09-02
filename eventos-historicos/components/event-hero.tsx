"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const PERIOD_TOP_LINE: Record<string, string> = {
  "Idade Antiga": "bg-gradient-to-r from-amber-500/50 via-amber-400/70 to-amber-500/50",
  "Idade Média": "bg-gradient-to-r from-stone-400/50 via-stone-300/70 to-stone-400/50",
  "Idade Moderna": "bg-gradient-to-r from-sky-500/50 via-sky-400/70 to-sky-500/50",
  "Idade Contemporânea": "bg-gradient-to-r from-slate-400/50 via-slate-300/70 to-slate-400/50",
}

interface EventHeroProps {
  title: string
  dateDisplay: string
  period: string
  category: string
  country: string
  region: string
  summary: string
  image?: string
}

export function EventHero({
  title,
  dateDisplay,
  period,
  category,
  country,
  region,
  summary,
  image,
}: EventHeroProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Double RAF ensures transition fires after initial paint
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  const topLineClass = PERIOD_TOP_LINE[period] ?? ""

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-end overflow-hidden bg-slate-950">
      {/* Period accent line */}
      {topLineClass && <div className={`absolute top-0 inset-x-0 h-[3px] z-30 ${topLineClass}`} />}

      {/* Background image */}
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill className="object-cover" priority />
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />

      {/* Breadcrumb / back nav */}
      <div className="absolute top-6 inset-x-0 z-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">
              Início
            </Link>
            <span className="text-white/30">/</span>
            <Link
              href="/linha-do-tempo"
              className="hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Linha do Tempo
            </Link>
          </nav>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 max-w-4xl pb-20 pt-32">
        {/* Badges */}
        <div
          className="flex flex-wrap gap-2 mb-5"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-bold px-3 py-1">
            {dateDisplay}
          </Badge>
          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">{period}</Badge>
          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">{category}</Badge>
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-6xl font-bold text-white text-balance leading-tight mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.85s ease 0.15s, transform 0.85s ease 0.15s",
          }}
        >
          {title}
        </h1>

        {/* Summary */}
        <p
          className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mb-8 text-pretty"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.85s ease 0.3s, transform 0.85s ease 0.3s",
          }}
        >
          {summary}
        </p>

        {/* Location */}
        <div
          className="flex items-center gap-2 text-white/60 text-sm"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease 0.5s",
          }}
        >
          <MapPin className="h-4 w-4" />
          <span>
            {country} · {region}
          </span>
        </div>
      </div>

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  )
}
