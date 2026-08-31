import type { StreamSort } from './stream-picker'

const KEY_SPEED = 'vesper.player.speed'
const KEY_SKIP_BUTTONS = 'vesper.player.skipButtons'
const KEY_STREAM_SORT = 'vesper.player.streamSort'
const KEY_AUTOPLAY_NEXT = 'vesper.player.autoplayNext'
const KEY_PIP_MINIMIZE = 'vesper.player.pipMinimize'

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
export const DEFAULT_SPEED = 1

export function readPlaybackSpeed(): number {
  const raw = localStorage.getItem(KEY_SPEED)
  if (!raw) return DEFAULT_SPEED
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SPEED
  return PLAYBACK_SPEEDS.includes(n as (typeof PLAYBACK_SPEEDS)[number]) ? n : DEFAULT_SPEED
}

export function writePlaybackSpeed(speed: number): void {
  localStorage.setItem(KEY_SPEED, String(speed))
}

export function readSkipButtonsEnabled(): boolean {
  const raw = localStorage.getItem(KEY_SKIP_BUTTONS)
  if (raw === null) return true
  return raw === '1'
}

export function writeSkipButtonsEnabled(enabled: boolean): void {
  localStorage.setItem(KEY_SKIP_BUTTONS, enabled ? '1' : '0')
}

export function readAutoplayNextEnabled(): boolean {
  const raw = localStorage.getItem(KEY_AUTOPLAY_NEXT)
  if (raw === null) return true
  return raw === '1'
}

export function writeAutoplayNextEnabled(enabled: boolean): void {
  localStorage.setItem(KEY_AUTOPLAY_NEXT, enabled ? '1' : '0')
}

export function readPipMinimizeEnabled(): boolean {
  return localStorage.getItem(KEY_PIP_MINIMIZE) === '1'
}

export function writePipMinimizeEnabled(enabled: boolean): void {
  localStorage.setItem(KEY_PIP_MINIMIZE, enabled ? '1' : '0')
}

export function readStreamSort(): StreamSort {
  const raw = localStorage.getItem(KEY_STREAM_SORT)
  return raw === 'quality' || raw === 'size' ? raw : 'default'
}

export function writeStreamSort(sort: StreamSort): void {
  localStorage.setItem(KEY_STREAM_SORT, sort)
}
