// Gera lib/generated/public-images.json com a lista de imagens existentes em /public.
// Usado por lib/public-images.ts para descartar referências a imagens que ainda não
// foram adicionadas ao repositório (evita 404, og:image quebrada e cards vazios).
// Executado automaticamente antes de `next build` (ver package.json).
import { readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { join, relative, dirname, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = join(root, "public")
const outFile = join(root, "lib", "generated", "public-images.json")
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return IMAGE_EXT.test(entry.name) ? ["/" + relative(publicDir, full).split(sep).join("/")] : []
  })
}

const images = walk(publicDir).sort()
mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(images, null, 0) + "\n")
console.log(`[image-manifest] ${images.length} imagens registradas em lib/generated/public-images.json`)
