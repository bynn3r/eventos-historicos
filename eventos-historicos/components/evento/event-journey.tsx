"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { MapPin } from "lucide-react"

interface Momento {
  data: string
  titulo: string
  local: string
  texto: string
  imagem: string
}

export function EventJourney({ momentos }: { momentos: Momento[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const refs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            setActiveIndex(index)
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    )

    for (const el of refs.current) {
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative">
      {/* Trilha central */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border md:left-1/2" aria-hidden />

      <div className="space-y-16 md:space-y-24">
        {momentos.map((momento, index) => {
          const isEven = index % 2 === 0
          const isActive = index === activeIndex

          return (
            <div
              key={index}
              ref={(el) => {
                refs.current[index] = el
              }}
              data-index={index}
              className="relative pl-12 md:pl-0"
            >
              {/* Marcador na trilha */}
              <div
                className={`absolute left-4 top-1.5 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-background transition-all duration-500 md:left-1/2 ${
                  isActive ? "scale-125 bg-primary" : "bg-muted-foreground/40"
                }`}
                aria-hidden
              />

              <div
                className={`grid gap-6 md:grid-cols-2 md:gap-12 transition-all duration-700 ${
                  isActive ? "opacity-100" : "opacity-60"
                }`}
              >
                <div className={`${isEven ? "md:order-1" : "md:order-2"}`}>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted shadow-sm">
                    <Image src={momento.imagem} alt={momento.titulo} fill className="object-cover" />
                  </div>
                </div>

                <div className={`flex flex-col justify-center ${isEven ? "md:order-2" : "md:order-1"}`}>
                  <span className="text-sm font-semibold uppercase tracking-wide text-primary">{momento.data}</span>
                  <h3 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{momento.titulo}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {momento.local}
                  </div>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">{momento.texto}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
