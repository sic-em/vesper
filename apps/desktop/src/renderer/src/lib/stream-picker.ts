import type { ParsedStream, QualityTier } from './comet'

interface PickOptions {
  bingeGroup?: string
  topN?: number
}

function tierScore(t: ParsedStream['qualityTier']): number {
  switch (t) {
    case '1080p':
      return 100
    case '720p':
      return 70
    case '4K-DV':
      return 65
    case '4K-HDR':
      return 60
    case '4K':
      return 55
    case '480p':
      return 30
    case 'SD':
      return 10
  }
}

function score(s: ParsedStream, opts: PickOptions): number {
  const tier = tierScore(s.qualityTier)
  const seedScore = Math.min(60, Math.log10(Math.max(1, s.seeders)) * 15)
  const bingeBonus = opts.bingeGroup && s.bingeGroup === opts.bingeGroup ? 200 : 0
  // Cached streams are instant — always rank them above any uncached stream.
  const cachedBonus = s.cached ? 1000 : 0
  return cachedBonus + bingeBonus + tier + seedScore
}

export function rankStreams(streams: ParsedStream[], opts: PickOptions = {}): ParsedStream[] {
  return streams.toSorted((a, b) => score(b, opts) - score(a, opts))
}

export function topCandidates(streams: ParsedStream[], opts: PickOptions = {}): ParsedStream[] {
  const ranked = rankStreams(streams, opts)
  const n = opts.topN ?? 3
  const out: ParsedStream[] = []
  const seen = new Set<string>()
  for (const s of ranked) {
    if (seen.has(s.playbackHash)) continue
    seen.add(s.playbackHash)
    out.push(s)
    if (out.length >= n) break
  }
  return out
}

export type StreamSort = 'default' | 'quality' | 'size'

export const STREAM_SORTS: { value: StreamSort; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'quality', label: 'Quality' },
  { value: 'size', label: 'Size' }
]

// Display order only — highest quality first. Kept separate from tierScore so changing what the
// list shows never moves what autoplay picks.
const QUALITY_ORDER: QualityTier[] = ['4K-DV', '4K-HDR', '4K', '1080p', '720p', '480p', 'SD']

function qualityRank(t: QualityTier): number {
  const i = QUALITY_ORDER.indexOf(t)
  return i === -1 ? QUALITY_ORDER.length : i
}

export function sortStreams(
  streams: ParsedStream[],
  sort: StreamSort,
  opts: PickOptions = {}
): ParsedStream[] {
  if (sort === 'quality') {
    return streams.toSorted(
      (a, b) =>
        qualityRank(a.qualityTier) - qualityRank(b.qualityTier) ||
        b.videoSize - a.videoSize ||
        b.seeders - a.seeders
    )
  }
  if (sort === 'size') {
    return streams.toSorted(
      (a, b) =>
        b.videoSize - a.videoSize ||
        qualityRank(a.qualityTier) - qualityRank(b.qualityTier) ||
        b.seeders - a.seeders
    )
  }
  return rankStreams(streams, opts)
}
