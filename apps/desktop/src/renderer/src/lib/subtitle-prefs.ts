export type SubFontFamily = 'sans' | 'serif' | 'mono' | 'casual' | 'smallCaps'
export type SubEdgeType = 'none' | 'dropShadow' | 'raised' | 'depressed' | 'uniform'

export interface SubtitleStyle {
  fontFamily: SubFontFamily
  fontSize: number
  fontColor: string
  fontOpacity: number
  bgColor: string
  bgOpacity: number
  windowColor: string
  windowOpacity: number
  edgeType: SubEdgeType
  edgeColor: string
  position: number
}

const KEY_STYLE = 'vesper.subs.style'
const KEY_SIZE_LEGACY = 'vesper.subs.size'
const KEY_BG_LEGACY = 'vesper.subs.bg'
const KEY_POS_LEGACY = 'vesper.subs.position'
const KEY_LAST_LANG = 'vesper.subs.lastLang'
const KEY_AUTO_SHOW = 'vesper.subs.autoShow'

export const PALETTE_COLORS: Array<{ value: string; name: string }> = [
  { value: '#FFFFFF', name: 'White' },
  { value: '#000000', name: 'Black' },
  { value: '#FF3B30', name: 'Red' },
  { value: '#FFD60A', name: 'Yellow' },
  { value: '#34C759', name: 'Green' },
  { value: '#5AC8FA', name: 'Cyan' },
  { value: '#FF2D92', name: 'Magenta' },
  { value: '#0A84FF', name: 'Blue' }
]

export const FONT_FAMILY_LABELS: Record<SubFontFamily, string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
  casual: 'Casual',
  smallCaps: 'Small caps'
}

export const FONT_FAMILY_CSS: Record<SubFontFamily, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"SF Mono", Menlo, Consolas, monospace',
  casual: '"Bradley Hand", "Comic Sans MS", cursive',
  smallCaps: '-apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif'
}

export const EDGE_TYPE_LABELS: Record<SubEdgeType, string> = {
  none: 'None',
  dropShadow: 'Drop shadow',
  raised: 'Raised',
  depressed: 'Depressed',
  uniform: 'Outline'
}

export const FONT_SIZE_MIN = 50
export const FONT_SIZE_MAX = 200
export const POSITION_MIN = 0
export const POSITION_MAX = 100

export const DEFAULT_STYLE: SubtitleStyle = {
  fontFamily: 'sans',
  fontSize: 150,
  fontColor: '#FFFFFF',
  fontOpacity: 100,
  bgColor: '#000000',
  bgOpacity: 0,
  windowColor: '#000000',
  windowOpacity: 0,
  edgeType: 'depressed',
  edgeColor: '#000000',
  position: 0
}

export interface SubtitlePreset {
  id: string
  label: string
  style: SubtitleStyle
}

export const PRESETS: SubtitlePreset[] = [
  {
    id: 'default',
    label: 'Default',
    style: { ...DEFAULT_STYLE }
  },
  {
    id: 'outline',
    label: 'Outline',
    style: {
      ...DEFAULT_STYLE,
      edgeType: 'uniform',
      edgeColor: '#000000'
    }
  },
  {
    id: 'high-contrast',
    label: 'High contrast',
    style: {
      ...DEFAULT_STYLE,
      fontColor: '#FFD60A',
      bgColor: '#000000',
      bgOpacity: 100,
      edgeType: 'none'
    }
  },
  {
    id: 'cinema',
    label: 'Cinema',
    style: {
      ...DEFAULT_STYLE,
      bgColor: '#000000',
      bgOpacity: 60,
      edgeType: 'uniform',
      edgeColor: '#000000'
    }
  }
]

function migrateLegacy(): SubtitleStyle | null {
  const size = localStorage.getItem(KEY_SIZE_LEGACY)
  const bg = localStorage.getItem(KEY_BG_LEGACY)
  const pos = localStorage.getItem(KEY_POS_LEGACY)
  if (size === null && bg === null && pos === null) return null
  const sizePx = Number(size)
  const fontSize =
    Number.isFinite(sizePx) && sizePx > 0 ? Math.round((sizePx / 18) * 100) : DEFAULT_STYLE.fontSize
  const bgMap = {
    none: { bgOpacity: 0, edgeType: 'none' as SubEdgeType },
    shadow: { bgOpacity: 0, edgeType: 'dropShadow' as SubEdgeType },
    block: { bgOpacity: 100, edgeType: 'none' as SubEdgeType }
  } as const
  const bgChoice = bgMap[(bg ?? 'shadow') as keyof typeof bgMap] ?? bgMap.shadow
  const posStep = Number(pos)
  const position =
    Number.isFinite(posStep) && posStep > 0
      ? Math.round(((posStep - 1) / 8) * 30)
      : DEFAULT_STYLE.position
  return {
    ...DEFAULT_STYLE,
    fontSize,
    bgOpacity: bgChoice.bgOpacity,
    edgeType: bgChoice.edgeType,
    position
  }
}

export function readSubtitleStyle(): SubtitleStyle {
  const raw = localStorage.getItem(KEY_STYLE)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<SubtitleStyle>
      return { ...DEFAULT_STYLE, ...parsed }
    } catch {
      // fall through to migration / defaults
    }
  }
  const migrated = migrateLegacy()
  if (migrated) {
    writeSubtitleStyle(migrated)
    localStorage.removeItem(KEY_SIZE_LEGACY)
    localStorage.removeItem(KEY_BG_LEGACY)
    localStorage.removeItem(KEY_POS_LEGACY)
    return migrated
  }
  return { ...DEFAULT_STYLE }
}

export function writeSubtitleStyle(style: SubtitleStyle): void {
  localStorage.setItem(KEY_STYLE, JSON.stringify(style))
}

export function readLastLang(): string | null {
  return localStorage.getItem(KEY_LAST_LANG)
}

export function writeLastLang(lang: string | null): void {
  if (lang === null) localStorage.removeItem(KEY_LAST_LANG)
  else localStorage.setItem(KEY_LAST_LANG, lang)
}

export function readAutoShow(): boolean {
  return localStorage.getItem(KEY_AUTO_SHOW) === '1'
}

export function writeAutoShow(on: boolean): void {
  localStorage.setItem(KEY_AUTO_SHOW, on ? '1' : '0')
}

const ISO3_TO_ISO1: Record<string, string> = {
  eng: 'en',
  spa: 'es',
  fre: 'fr',
  fra: 'fr',
  ger: 'de',
  deu: 'de',
  ita: 'it',
  por: 'pt',
  jpn: 'ja',
  kor: 'ko',
  chi: 'zh',
  zho: 'zh',
  rus: 'ru',
  ara: 'ar',
  hin: 'hi',
  dut: 'nl',
  nld: 'nl',
  pol: 'pl',
  swe: 'sv',
  tur: 'tr',
  dan: 'da',
  fin: 'fi',
  nor: 'no',
  cze: 'cs',
  ces: 'cs',
  hun: 'hu',
  rum: 'ro',
  ron: 'ro',
  gre: 'el',
  ell: 'el',
  heb: 'he',
  tha: 'th',
  vie: 'vi',
  ind: 'id',
  ukr: 'uk',
  per: 'fa',
  fas: 'fa'
}

export function normalizeLangCode(lang: string | null | undefined): string {
  if (!lang) return ''
  const k = lang.toLowerCase()
  if (k.length === 2) return k
  return ISO3_TO_ISO1[k] ?? k
}

function withOpacity(hex: string, percent: number): string {
  const op = Math.max(0, Math.min(100, percent)) / 100
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${op.toFixed(3)})`
}

export function colorWithOpacity(hex: string, percent: number): string {
  return withOpacity(hex, percent)
}

export function edgeShadowFor(type: SubEdgeType, color: string): string {
  switch (type) {
    case 'none':
      return 'none'
    case 'dropShadow':
      return `2px 2px 4px ${color}`
    case 'raised':
      return `1px 1px 0 ${color}, 0 -1px 0 ${color}, 0 -2px 0 ${color}`
    case 'depressed':
      return `0 1px 0 ${color}, 0 2px 0 ${color}, 1px 1px 0 ${color}`
    case 'uniform':
      return `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}, -2px 0 0 ${color}, 2px 0 0 ${color}, 0 -2px 0 ${color}, 0 2px 0 ${color}`
  }
}
