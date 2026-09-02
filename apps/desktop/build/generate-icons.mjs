// Regenerates all app icons from icon-source.svg.
// Run from repo root: node apps/desktop/build/generate-icons.mjs
// Windows (full-bleed, own silhouette): build/icon.ico, build/icon.png, resources/icon.png
// macOS (artwork in the 824/1024 Apple grid footprint): build/icon.icns, resources/icon-mac.png
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const sharp = require('sharp')
const png2icons = require('png2icons')

const here = path.dirname(fileURLToPath(import.meta.url))
const resources = path.join(here, '..', 'resources')
const svg = readFileSync(path.join(here, 'icon-source.svg'))

// Render big, then trim the transparent margins so the artwork fills the frame.
const trimmed = await sharp(svg, { density: 300 }).trim().png().toBuffer()
const meta = await sharp(trimmed).metadata()
const box = Math.max(meta.width, meta.height)

// Full-bleed square (Windows): artwork centered, no padding.
const fullBleed = await sharp({
  create: { width: box, height: box, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([{ input: trimmed, gravity: 'centre' }])
  .png()
  .toBuffer()
const win1024 = await sharp(fullBleed).resize(1024, 1024).png().toBuffer()

// macOS: artwork scaled to the standard 824x824 icon grid on a 1024 canvas,
// so margins/shadow zones match Apple's template (Tahoe re-masks it itself).
const macArt = await sharp(fullBleed).resize(824, 824).png().toBuffer()
const mac1024 = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([{ input: macArt, gravity: 'centre' }])
  .png()
  .toBuffer()

writeFileSync(path.join(here, 'icon.png'), win1024)
writeFileSync(path.join(resources, 'icon.png'), win1024)
writeFileSync(path.join(resources, 'icon-mac.png'), mac1024)

const ico = png2icons.createICO(win1024, png2icons.BICUBIC2, 0, false, true)
if (!ico) throw new Error('ICO generation failed')
writeFileSync(path.join(here, 'icon.ico'), ico)

const icns = png2icons.createICNS(mac1024, png2icons.BICUBIC2, 0)
if (!icns) throw new Error('ICNS generation failed')
writeFileSync(path.join(here, 'icon.icns'), icns)

console.log('done', { trimmed: `${meta.width}x${meta.height}` })
