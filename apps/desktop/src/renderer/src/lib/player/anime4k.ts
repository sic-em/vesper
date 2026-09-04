// Anime4K real-time upscaling: domain types and preset policy (ADR-0015).
// The GPU chain itself lives in anime4k-chain.ts so this module stays import-light —
// prefs and settings UI read these types without pulling in the shader library.

export type Anime4kPreset = 'performance' | 'balanced' | 'quality'

/** Ascending GPU cost — the step-down ladder walks this list leftwards. */
export const ANIME4K_PRESETS: readonly Anime4kPreset[] = ['performance', 'balanced', 'quality']

export const ANIME4K_DEFAULT_PRESET: Anime4kPreset = 'balanced'

export const ANIME4K_PRESET_LABELS: Record<Anime4kPreset, string> = {
  performance: 'Performance',
  balanced: 'Balanced',
  quality: 'Quality'
}

export interface Anime4kPref {
  enabled: boolean
  preset: Anime4kPreset
}

/**
 * What the pipeline is actually doing, as opposed to what the user's toggle says.
 * The toggle can be on while a bypass or step-down means nothing (or less) is applied —
 * both are always surfaced, never silent.
 */
export type Anime4kStatus =
  | { kind: 'off' }
  | { kind: 'active'; preset: Anime4kPreset }
  | { kind: 'bypassed'; reason: 'hdr' | 'resolution' }
  /** Enabled, but stepped all the way off this session because playback couldn't keep up. */
  | { kind: 'suspended' }

export function anime4kStatusLabel(s: Anime4kStatus): string {
  switch (s.kind) {
    case 'off':
      return 'off'
    case 'active':
      return ANIME4K_PRESET_LABELS[s.preset]
    case 'suspended':
      return 'off (playback struggled)'
    case 'bypassed':
      return s.reason === 'hdr' ? 'bypassed (HDR source)' : 'bypassed (nothing to upscale)'
  }
}

export function sameAnime4kStatus(a: Anime4kStatus, b: Anime4kStatus): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'active' && b.kind === 'active') return a.preset === b.preset
  if (a.kind === 'bypassed' && b.kind === 'bypassed') return a.reason === b.reason
  return true
}

/** Next cheaper tier, or null when already at the cheapest. */
export function stepDownPreset(p: Anime4kPreset): Anime4kPreset | null {
  const i = ANIME4K_PRESETS.indexOf(p)
  return i > 0 ? ANIME4K_PRESETS[i - 1] : null
}

export function capPreset(p: Anime4kPreset, ceiling: Anime4kPreset): Anime4kPreset {
  return ANIME4K_PRESETS.indexOf(p) <= ANIME4K_PRESETS.indexOf(ceiling) ? p : ceiling
}
