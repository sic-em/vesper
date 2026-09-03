import { app, ipcMain, nativeImage, type BrowserWindow, type NativeImage } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'
import iconMac from '../../resources/icon-mac.png?asset'
import hiddenLeaf from '../../resources/icons/hidden-leaf.png?asset'
import akatsuki from '../../resources/icons/akatsuki.png?asset'
import soda from '../../resources/icons/soda.png?asset'
import threeDee from '../../resources/icons/3d.png?asset'
import superSaiyan from '../../resources/icons/super-saiyan.png?asset'
import ramen from '../../resources/icons/ramen.png?asset'

export const ICON_VARIANTS = [
  'popcorn',
  'hidden-leaf',
  'akatsuki',
  'soda',
  '3d',
  'super-saiyan',
  'ramen'
] as const

export type IconVariantId = (typeof ICON_VARIANTS)[number]

const ICON_VARIANT_FILE = join(app.getPath('userData'), 'icon-variant.json')
const DEFAULT_IMAGE_PATH = process.platform === 'darwin' ? iconMac : icon

// 'popcorn' is the Default icon, so it resolves to the packaged icon assets
// rather than its own padded variant file.
const VARIANT_ASSETS: Record<IconVariantId, string> = {
  popcorn: DEFAULT_IMAGE_PATH,
  'hidden-leaf': hiddenLeaf,
  akatsuki,
  soda,
  '3d': threeDee,
  'super-saiyan': superSaiyan,
  ramen
}

function isIconVariant(value: unknown): value is IconVariantId {
  return typeof value === 'string' && (ICON_VARIANTS as readonly string[]).includes(value)
}

function readStoredVariant(): IconVariantId {
  try {
    const raw = JSON.parse(readFileSync(ICON_VARIANT_FILE, 'utf8')) as { variant?: unknown }
    if (isIconVariant(raw.variant)) return raw.variant
  } catch {
    /* missing or invalid */
  }
  return 'popcorn'
}

function variantImage(variant: IconVariantId): NativeImage {
  const img = nativeImage.createFromPath(VARIANT_ASSETS[variant])
  if (img.isEmpty()) return nativeImage.createFromPath(DEFAULT_IMAGE_PATH)
  return img
}

export function currentIconVariant(): IconVariantId {
  return readStoredVariant()
}

export function windowIconImage(): NativeImage {
  return variantImage(readStoredVariant())
}

export function applyAppIcon(variant: IconVariantId, window: BrowserWindow | null): void {
  const img = variantImage(variant)
  if (process.platform === 'darwin') {
    if (app.dock) app.dock.setIcon(img)
  } else if (window && !window.isDestroyed()) {
    window.setIcon(img)
  }
}

export function registerIconVariants(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('appIcon:getVariant', () => readStoredVariant())
  ipcMain.handle('appIcon:setVariant', (_e, variant: unknown) => {
    if (!isIconVariant(variant)) throw new Error('unknown icon variant')
    try {
      writeFileSync(ICON_VARIANT_FILE, JSON.stringify({ variant }), 'utf8')
    } catch {
      /* persistence failure still allows the live swap */
    }
    applyAppIcon(variant, getWindow())
  })
}
