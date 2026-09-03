// Regenerates the Windows .ico for every app-icon variant.
// Run from repo root: node apps/desktop/build/generate-variant-icos.mjs
//
// Windows draws the taskbar button from the shortcut that matches the app's
// AppUserModelID, and a shortcut can only point at an .ico. Picking a variant
// rewrites those shortcuts (see main/icon-variants.ts), so every variant needs
// one alongside its PNG.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const png2icons = require('png2icons')

const here = path.dirname(fileURLToPath(import.meta.url))
const resources = path.join(here, '..', 'resources')
const iconsDir = path.join(resources, 'icons')

// 'popcorn' is the default, so its .ico comes from the same artwork as the
// packaged exe icon rather than the padded variant PNG.
const SOURCES = {
  popcorn: path.join(resources, 'icon.png'),
  'hidden-leaf': path.join(iconsDir, 'hidden-leaf.png'),
  akatsuki: path.join(iconsDir, 'akatsuki.png'),
  soda: path.join(iconsDir, 'soda.png'),
  '3d': path.join(iconsDir, '3d.png'),
  'super-saiyan': path.join(iconsDir, 'super-saiyan.png'),
  ramen: path.join(iconsDir, 'ramen.png')
}

for (const [id, src] of Object.entries(SOURCES)) {
  const ico = png2icons.createICO(readFileSync(src), png2icons.BICUBIC2, 0, false, true)
  if (!ico) throw new Error(`ICO generation failed for ${id}`)
  const out = path.join(iconsDir, `${id}.ico`)
  writeFileSync(out, ico)
  console.log(`${id} -> ${path.relative(process.cwd(), out)} (${ico.length} bytes)`)
}
