import { app, ipcMain, nativeImage, shell, type BrowserWindow, type NativeImage } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import icon from '../../resources/icon.png?asset'
import iconMac from '../../resources/icon-mac.png?asset'
import hiddenLeaf from '../../resources/icons/hidden-leaf.png?asset'
import akatsuki from '../../resources/icons/akatsuki.png?asset'
import soda from '../../resources/icons/soda.png?asset'
import threeDee from '../../resources/icons/3d.png?asset'
import superSaiyan from '../../resources/icons/super-saiyan.png?asset'
import ramen from '../../resources/icons/ramen.png?asset'
import popcornIco from '../../resources/icons/popcorn.ico?asset'
import hiddenLeafIco from '../../resources/icons/hidden-leaf.ico?asset'
import akatsukiIco from '../../resources/icons/akatsuki.ico?asset'
import sodaIco from '../../resources/icons/soda.ico?asset'
import threeDeeIco from '../../resources/icons/3d.ico?asset'
import superSaiyanIco from '../../resources/icons/super-saiyan.ico?asset'
import ramenIco from '../../resources/icons/ramen.ico?asset'

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

const VARIANT_ICOS: Record<IconVariantId, string> = {
  popcorn: popcornIco,
  'hidden-leaf': hiddenLeafIco,
  akatsuki: akatsukiIco,
  soda: sodaIco,
  '3d': threeDeeIco,
  'super-saiyan': superSaiyanIco,
  ramen: ramenIco
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

// The Windows shell reads a shortcut's icon itself and cannot see inside app.asar,
// so point it at the unpacked copy that electron-builder writes for resources/**.
function shellReadablePath(path: string): string {
  return path.replace(`${sep}app.asar${sep}`, `${sep}app.asar.unpacked${sep}`)
}

function shortcutPaths(): string[] {
  const name = `${app.getName()}.lnk`
  const appData = app.getPath('appData')
  return [
    join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', name),
    join(app.getPath('desktop'), name),
    join(appData, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar', name)
  ]
}

// Windows ties the taskbar button to the shortcut matching the app's
// AppUserModelID and draws that shortcut's icon, ignoring the window icon.
// Repointing the shortcuts is what makes a pick visible outside the app.
function updateShortcutIcons(variant: IconVariantId): void {
  if (process.platform !== 'win32' || !app.isPackaged) return
  const iconPath = shellReadablePath(VARIANT_ICOS[variant])
  if (!existsSync(iconPath)) return
  for (const link of shortcutPaths()) {
    if (!existsSync(link)) continue
    try {
      const details = shell.readShortcutLink(link)
      if (details.icon === iconPath && details.iconIndex === 0) continue
      shell.writeShortcutLink(link, 'update', { ...details, icon: iconPath, iconIndex: 0 })
    } catch {
      /* a shortcut the user moved, replaced, or locked is not worth failing the swap over */
    }
  }
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
  updateShortcutIcons(variant)
}

export function registerIconVariants(getWindow: () => BrowserWindow | null): void {
  // An installer update recreates the shortcuts with the default artwork, so
  // re-apply the stored pick on launch.
  updateShortcutIcons(readStoredVariant())

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
