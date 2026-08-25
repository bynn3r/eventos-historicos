"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin, X } from "lucide-react"

interface Local {
  nome: string
  lat: number
  lng: number
  descricao: string
}

// Mapa ilustrativo (projeção equiretangular aproximada, cortada nos polos) —
// posições calculadas a partir de lat/lng para fins editoriais, não uma
// ferramenta de geolocalização de precisão.
const LAT_MIN = -60
const LAT_MAX = 84

function toPosition(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
  return { x, y }
}

export function EventMap({ locais }: { locais: Local[] }) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-muted/40">
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        <Image
          src="/eventos/world-map.svg"
          alt="Mapa-múndi ilustrativo com os principais locais do evento"
          fill
          className="object-contain opacity-90 dark:opacity-70 dark:invert"
        />

        {locais.map((local, index) => {
          const { x, y } = toPosition(local.lat, local.lng)
          const isSelected = selected === index

          return (
            <button
              key={local.nome}
              type="button"
              onClick={() => setSelected(isSelected ? null : index)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-full focus:outline-none"
            >
              <span
                className={`absolute -inset-2 rounded-full bg-primary/30 transition-transform duration-300 ${
                  isSelected ? "scale-100" : "scale-0 group-hover:scale-100"
                }`}
                aria-hidden
              />
              <MapPin
                className={`relative h-6 w-6 drop-shadow transition-colors ${
                  isSelected ? "fill-primary text-primary-foreground" : "fill-foreground text-background"
                }`}
              />
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {local.nome}
              </span>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="border-t bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">{locais[selected].nome}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{locais[selected].descricao}</p>
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
      )}

      {selected === null && (
        <div className="border-t bg-card p-4 text-center text-sm text-muted-foreground">
          Toque nos marcadores para explorar os lugares deste evento
        </div>
      )}
    </div>
  )
}
