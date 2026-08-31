#!/usr/bin/env node
/**
 * Regenerate frontend/src/features/photography/photographyAssetManifest.ts
 * from assets/photography (same layout as Cloudflare upload).
 * After updating originals, also run: npm run generate:photography-variants
 *
 * Usage: npm run generate:photography-manifest
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const photoRoot = path.resolve(__dirname, '../assets/photography')
const outFile = path.resolve(
  __dirname,
  '../frontend/src/features/photography/photographyAssetManifest.ts',
)

if (!fs.existsSync(photoRoot)) {
  console.error(`Missing photography folder: ${photoRoot}`)
  process.exit(1)
}

const folders = fs
  .readdirSync(photoRoot)
  .filter((name) => {
    if (name === 'thumbs' || name === 'display') return false
    return fs.statSync(path.join(photoRoot, name)).isDirectory()
  })
  .sort()

const manifest = {}
for (const folder of folders) {
  const files = fs
    .readdirSync(path.join(photoRoot, folder))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  manifest[folder] = files
}

const lines = [
  '// Auto-generated from assets/photography — run: npm run generate:photography-manifest',
  'export const PHOTOGRAPHY_ASSET_MANIFEST = {',
  ...Object.entries(manifest).map(([folder, files]) => {
    const fileLines = files.map((f) => `    ${JSON.stringify(f)},`).join('\n')
    return `  ${JSON.stringify(folder)}: [\n${fileLines}\n  ] as const,`
  }),
  '} as const',
  '',
  'export type PhotographyAssetFolder = keyof typeof PHOTOGRAPHY_ASSET_MANIFEST',
  '',
]

fs.writeFileSync(outFile, lines.join('\n'))

const total = Object.values(manifest).reduce((n, arr) => n + arr.length, 0)
console.log(`Wrote ${outFile}`)
console.log(`${Object.keys(manifest).length} countries, ${total} photos`)
