// Projeção equiretangular aproximada (cortada nos polos) para posicionar
// marcadores sobre a ilustração `/eventos/world-map.svg` — uso editorial,
// não uma ferramenta de geolocalização de precisão. Compartilhada entre o
// mapa de um único evento (EventMap) e o mapa histórico global (/mapa).
const LAT_MIN = -60
const LAT_MAX = 84

export function toMapPosition(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
  return { x, y }
}
