import publicImages from "@/lib/generated/public-images.json"

// Manifesto gerado por scripts/generate-image-manifest.mjs (roda antes do build).
const existing = new Set<string>(publicImages as string[])

/**
 * Retorna o caminho da imagem somente se o arquivo existir em /public.
 * Referências a imagens ainda não adicionadas viram `undefined`, e cada componente
 * usa seu estado sem imagem (hero escuro, inicial do personagem, card sem capa).
 * URLs externas são mantidas como estão.
 */
export function existingImage(src?: string | null): string | undefined {
  if (!src) return undefined
  if (!src.startsWith("/")) return src
  return existing.has(src.split("?")[0]) ? src : undefined
}
