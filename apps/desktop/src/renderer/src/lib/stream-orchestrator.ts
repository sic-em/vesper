import { queryClient } from '../router'
import { fetchMovieStreams, fetchSeriesStreams } from './comet'
import type { ParsedStream } from './comet'
import { topCandidates } from './stream-picker'
import { resolveStreamUrl, type StreamContext } from './resolve-stream'

const SCRAPE_STALE = 10 * 60_000
const SCRAPE_GC = 60 * 60_000

export interface ScrapeKey {
  mediaType: 'movie' | 'tv'
  imdbId: string
  season?: number
  episode?: number
  tmdbId?: number
}

function scrapeQueryKey(k: ScrapeKey): unknown[] {
  return k.mediaType === 'movie'
    ? ['streams', 'movie', k.imdbId, undefined, undefined]
    : ['streams', 'tv', k.imdbId, k.season, k.episode]
}

export function ensureScrape(k: ScrapeKey): Promise<ParsedStream[]> {
  return queryClient.ensureQueryData({
    queryKey: scrapeQueryKey(k),
    queryFn: () =>
      k.mediaType === 'movie'
        ? fetchMovieStreams(k.imdbId)
        : fetchSeriesStreams(k.imdbId, k.season!, k.episode!, k.tmdbId),
    staleTime: SCRAPE_STALE,
    gcTime: SCRAPE_GC
  })
}

function contextOf(k: ScrapeKey): StreamContext {
  return {
    mediaType: k.mediaType,
    imdbId: k.imdbId,
    season: k.season,
    episode: k.episode,
    tmdbId: k.tmdbId
  }
}

async function probePlayable(url: string, signal: AbortSignal): Promise<void> {
  const r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal })
  if (!r.ok && r.status !== 206) throw new Error(`probe ${r.status}`)
  await r.arrayBuffer()
}

export interface RaceResult {
  stream: ParsedStream
  url: string
}

// Resolve the best cached stream for a title. Tries candidates in rank order; on a dead /
// expired debrid link, auto-advances to the next. No P2P fallback (debrid-only, ADR-0008).
export async function scrapeAndRace(args: {
  scrape: ScrapeKey
  bingeGroup?: string
}): Promise<RaceResult> {
  const streams = await ensureScrape(args.scrape)
  const candidates = topCandidates(streams, { bingeGroup: args.bingeGroup, topN: 5 })
  if (candidates.length === 0) throw new Error('no streams available')

  const ordered = args.bingeGroup
    ? [
        ...candidates.filter((s) => s.bingeGroup === args.bingeGroup),
        ...candidates.filter((s) => s.bingeGroup !== args.bingeGroup)
      ]
    : candidates

  const context = contextOf(args.scrape)
  let lastErr: unknown
  for (const stream of ordered) {
    const ctrl = new AbortController()
    const timeoutId = window.setTimeout(() => ctrl.abort(), 15_000)
    try {
      const url = await resolveStreamUrl({ stream, context })
      await probePlayable(url, ctrl.signal)
      return { stream, url }
    } catch (e) {
      lastErr = e
    } finally {
      window.clearTimeout(timeoutId)
    }
  }
  throw lastErr ?? new Error('stream resolution failed')
}
