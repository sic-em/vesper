import type { SelectedSub } from '@renderer/components/player/subtitle-overlay'

const PREFIX = 'vesper.subs.offset'
export const OFFSET_MIN = -10
export const OFFSET_MAX = 10
export const OFFSET_STEP = 0.1

export interface OffsetScope {
  imdbId: string
  season?: number
  episode?: number
  selected: SelectedSub
}

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export function offsetKey(scope: OffsetScope): string | null {
  const { selected, imdbId, season, episode } = scope
  if (!selected || selected.source !== 'online') return null
  if (!imdbId) return null
  const s = season ?? 'm'
  const e = episode ?? 'm'
  const src = `online:${hashStr(selected.url)}`
  return `${PREFIX}.${imdbId}.${s}.${e}.${src}`
}

export function readOffset(scope: OffsetScope): number {
  const key = offsetKey(scope)
  if (!key) return 0
  const raw = localStorage.getItem(key)
  if (raw === null) return 0
  const n = Number(raw)
  return Number.isFinite(n) ? clampOffset(n) : 0
}

export function writeOffset(scope: OffsetScope, value: number): void {
  const key = offsetKey(scope)
  if (!key) return
  const v = clampOffset(value)
  if (v === 0) localStorage.removeItem(key)
  else localStorage.setItem(key, v.toFixed(1))
}

export function clampOffset(v: number): number {
  if (!Number.isFinite(v)) return 0
  const c = Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, v))
  return Math.round(c * 10) / 10
}

export function formatOffset(v: number): string {
  const r = clampOffset(v)
  const sign = r > 0 ? '+' : r < 0 ? '−' : ''
  return `${sign}${Math.abs(r).toFixed(1)}s`
}
