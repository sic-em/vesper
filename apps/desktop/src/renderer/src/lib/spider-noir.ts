import type { ParsedStream } from './comet'
import { rankStreams } from './stream-picker'

// Spider-Noir ships a colorized cut and a black-and-white cut of every episode as separate
// releases. This module classifies a release and remembers the viewer's preferred look.
export const SPIDER_NOIR_IMDB = 'tt30460310'

export type ColorVariant = 'color' | 'bw'

// Matches the BW markers seen in release names: `.BW.`, `_BW_`, `Authentic.BW`, "black and
// white", "b&w". Separators are any non-alphanumeric so dotted and underscored names both hit;
// the lookarounds keep it from matching inside words like "subway".
const BW_RE =
  /(?:^|[^a-z0-9])(?:authentic[^a-z0-9]+)?bw(?=[^a-z0-9]|$)|black[^a-z0-9]?and[^a-z0-9]?white|b&w/i

export function isSpiderNoir(imdbId: string | undefined): boolean {
  return imdbId === SPIDER_NOIR_IMDB
}

export function filenameVariant(name?: string): ColorVariant {
  return name && BW_RE.test(name) ? 'bw' : 'color'
}

export function streamVariant(s: ParsedStream): ColorVariant {
  return BW_RE.test(`${s.filename ?? ''} ${s.titleLine} ${s.name}`) ? 'bw' : 'color'
}

// Best release of the requested variant: cached first, then rank order. Drops DV (undecodable).
export function pickVariantStream(
  streams: ParsedStream[],
  variant: ColorVariant
): ParsedStream | undefined {
  const ranked = rankStreams(
    streams.filter((s) => s.qualityTier !== '4K-DV' && streamVariant(s) === variant)
  )
  return ranked.find((s) => s.cached) ?? ranked[0]
}

const PREF_KEY = 'vesper.spidernoir.variant'

export function readVariantPref(): ColorVariant | null {
  const v = localStorage.getItem(PREF_KEY)
  return v === 'bw' || v === 'color' ? v : null
}

export function writeVariantPref(v: ColorVariant): void {
  localStorage.setItem(PREF_KEY, v)
}
