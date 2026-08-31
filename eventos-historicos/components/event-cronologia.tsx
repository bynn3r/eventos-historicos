import type { TimelineCronologiaItem } from "@/lib/timeline"

interface EventCronologiaProps {
  cronologia: TimelineCronologiaItem[]
}

export function EventCronologia({ cronologia }: EventCronologiaProps) {
  if (!cronologia || cronologia.length === 0) return null

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">Cronologia</h2>
      <ol className="relative border-l-2 border-border ml-2 space-y-0">
        {cronologia.map((item, index) => (
          <li key={index} className="relative pl-8 pb-6 last:pb-0">
            {/* Dot */}
            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
            <time className="text-xs font-semibold text-primary uppercase tracking-wider leading-none">
              {item.ano}
            </time>
            <p className="mt-1 text-sm text-foreground leading-snug">{item.titulo}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
