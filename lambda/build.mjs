import { build } from "esbuild"
import { execSync } from "child_process"
import { mkdirSync, existsSync } from "fs"

if (!existsSync("dist")) mkdirSync("dist")

await build({
  entryPoints: ["src/handler.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  // AWS SDK v3 is included in Node.js 20.x Lambda runtime
  external: ["@aws-sdk/*"],
  minify: false,
  sourcemap: false,
})

// Wrap as CommonJS-compatible handler (Lambda requires handler export)
// Lambda supports ESM via .mjs extension
console.log("Bundle created: dist/index.mjs")

// Create zip for Terraform deployment
try {
  execSync("cd dist && zip -r ../function.zip index.mjs", { stdio: "inherit" })
  console.log("Zip created: function.zip")
} catch {
  // On Windows use PowerShell
  execSync('powershell -Command "Compress-Archive -Path dist/index.mjs -DestinationPath function.zip -Force"', { stdio: "inherit" })
  console.log("Zip created: function.zip (PowerShell)")
}
