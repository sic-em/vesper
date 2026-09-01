import { convexClient } from './convex-client'
import { api } from '@convex/_generated/api'
import { queryClient } from '../router'
import { tvSeasonQuery } from './tmdb-queries'

export type QualityTier = '4K-DV' | '4K-HDR' | '4K' | '1080p' | '720p' | '480p' | 'SD'

export type StreamSource = 'comet' | 'torrentio' | 'sootio' | 'meteor'

export interface ParsedStream {
  playbackHash: string
  source: StreamSource
  name: string
  qualityTier: QualityTier
  qualityLabel: string
  titleLine: string
  filename?: string
  videoSize: number
  sizeLabel: string
  bingeGroup?: string
  audioLangs: string[]
  seeders: number
  cached: boolean
}

interface CometStream {
  playbackHash: string
  source: StreamSource
  name: string
  description: string
  filename?: string
  videoSize: number
  bingeGroup?: string
  cached: boolean
}

function parseQuality(text: string): { tier: QualityTier; label: string } {
  const n = text.toUpperCase()
  if (/4K|2160P|UHD/.test(n) && /\bDV\b|DOLBY\s*VISION/.test(n))
    return { tier: '4K-DV', label: '4K DV' }
  if (/4K|2160P|UHD/.test(n) && /HDR/.test(n)) return { tier: '4K-HDR', label: '4K HDR' }
  if (/4K|2160P|UHD/.test(n)) return { tier: '4K', label: '4K' }
  if (/1080P/.test(n)) return { tier: '1080p', label: '1080p' }
  if (/720P/.test(n)) return { tier: '720p', label: '720p' }
  if (/480P|SD/.test(n)) return { tier: '480p', label: '480p' }
  return { tier: 'SD', label: 'SD' }
}

const LANG_FLAGS_RE = /[\uD83C][\uDDE6-\uDDFF]{2}|🇬🇧|🇺🇸|🇪🇸|🇫🇷|🇩🇪|🇮🇹|🇯🇵|🇨🇳|🇰🇷|🇧🇷|🇷🇺|🇮🇳/g
const FLAG_TO_LANG: Record<string, string> = {
  '🇺🇸': 'EN',
  '🇬🇧': 'EN',
  '🇪🇸': 'ES',
  '🇫🇷': 'FR',
  '🇩🇪': 'DE',
  '🇮🇹': 'IT',
  '🇯🇵': 'JA',
  '🇨🇳': 'ZH',
  '🇰🇷': 'KO',
  '🇧🇷': 'PT',
  '🇷🇺': 'RU',
  '🇮🇳': 'HI'
}

function parseLangs(s: string): string[] {
  const flags = s.match(LANG_FLAGS_RE) ?? []
  return Array.from(new Set(flags.map((f) => FLAG_TO_LANG[f]).filter((x): x is string => !!x)))
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '?'
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`
  return `${bytes} B`
}

function firstLine(s: string): string {
  return (s.split('\n')[0] ?? s).replace(/^📄\s*/, '').trim()
}

const SEED_RE = /👤\s*(\d+)/

function parseStream(s: CometStream): ParsedStream {
  const { tier, label } = parseQuality(`${s.name} ${s.description}`)
  return {
    playbackHash: s.playbackHash,
    source: s.source,
    name: s.name,
    qualityTier: tier,
    qualityLabel: label,
    titleLine: firstLine(s.description),
    filename: s.filename,
    videoSize: s.videoSize,
    sizeLabel: formatSize(s.videoSize),
    bingeGroup: s.bingeGroup,
    audioLangs: parseLangs(s.description),
    seeders: parseInt(s.description.match(SEED_RE)?.[1] ?? '0', 10),
    cached: s.cached
  }
}

export async function fetchMovieStreams(imdbId: string): Promise<ParsedStream[]> {
  const streams = await convexClient.action(api.comet.fetchStreams, { type: 'movie', imdbId })
  return streams.filter((s: CometStream) => s.cached).map(parseStream)
}

// TMDB absolute-numbered seasons start at ep N (not 1); Comet wants season-relative.
async function seasonEpisodeOffset(tmdbId: number, season: number): Promise<number> {
  try {
    const s = await queryClient.ensureQueryData(tvSeasonQuery(tmdbId, season))
    return Math.max(0, (s.episodes[0]?.episode_number ?? 1) - 1)
  } catch {
    return 0
  }
}

async function effectiveEpisode(season: number, episode: number, tmdbId?: number): Promise<number> {
  if (tmdbId === undefined) return episode
  const offset = await seasonEpisodeOffset(tmdbId, season)
  return offset > 0 ? episode - offset : episode
}

export async function fetchSeriesStreams(
  imdbId: string,
  season: number,
  episode: number,
  tmdbId?: number
): Promise<ParsedStream[]> {
  const ep = await effectiveEpisode(season, episode, tmdbId)
  const streams = await convexClient.action(api.comet.fetchStreams, {
    type: 'series',
    imdbId,
    season,
    episode: ep
  })
  return streams.filter((s: CometStream) => s.cached).map(parseStream)
}

export async function resolveStream(args: {
  type: 'movie' | 'series'
  imdbId: string
  season?: number
  episode?: number
  tmdbId?: number
  playbackHash: string
  source?: StreamSource
}): Promise<string> {
  const { type, imdbId, season, episode, tmdbId, playbackHash, source } = args
  const ep =
    type === 'series' && season !== undefined && episode !== undefined
      ? await effectiveEpisode(season, episode, tmdbId)
      : episode
  return convexClient.action(api.comet.resolve, {
    type,
    imdbId,
    season,
    episode: ep,
    playbackHash,
    source
  })
}
