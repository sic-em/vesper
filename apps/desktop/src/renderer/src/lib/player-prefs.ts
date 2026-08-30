const KEY_SPEED = 'vesper.player.speed'
const KEY_SKIP_BUTTONS = 'vesper.player.skipButtons'

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
