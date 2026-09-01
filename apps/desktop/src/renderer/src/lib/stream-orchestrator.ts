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

// Nothing smaller than this is an episode, whatever the addon claimed it was.
const MIN_PLAUSIBLE_BYTES = 20 * 1024 * 1024
// A remux and its listing can disagree a little; a placeholder and its listing disagree by orders
// of magnitude.
const MIN_SIZE_RATIO = 0.5

/** Total bytes of the resource, from a range response or a plain one. Null when unstated. */
function totalBytes(r: Response): number | null {
  const match = r.headers.get('content-range')?.match(/\/(\d+)\s*$/)
  if (match) return Number(match[1])
  if (r.status === 200) {
    const len = Number(r.headers.get('content-length'))
    return Number.isFinite(len) && len > 0 ? len : null
  }
  return null
}

/**
 * The addon says a torrent is cached, but the debrid service is the one that has to be holding it.
 * When its cache check was stale it answers with a short "torrent is being downloaded" clip rather
 * than an error — a real, playable video that is not the episode. Size is the tell, and it is in
 * the headers of the probe we already make.
 */
async function probePlayable(
  url: string,
  expectedBytes: number,
  signal: AbortSignal
): Promise<void> {
  const r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal })
  if (!r.ok && r.status !== 206) throw new Error(`probe ${r.status}`)
  await r.arrayBuffer()

  const total = totalBytes(r)
  if (total === null) return
  if (total < MIN_PLAUSIBLE_BYTES) throw new Error(`probe served ${total} bytes, not the episode`)
  if (expectedBytes > 0 && total < expectedBytes * MIN_SIZE_RATIO) {
    throw new Error(`probe served ${total} bytes, listing said ${expectedBytes}`)
  }
}

export interface RaceResult {
  stream: ParsedStream
  url: string
}

/**
 * Where a resolve has got to. An unlabelled spinner makes a multi-second wait feel indefinite;
 * naming the stage costs nothing and tells the viewer the wait is progressing rather than stuck.
 */
export type ResolveStage = 'finding' | 'opening' | 'starting'

// Resolve the best cached stream for a title. Tries candidates in rank order; on a dead /
// expired debrid link, auto-advances to the next. No P2P fallback (debrid-only, ADR-0008).
export async function scrapeAndRace(args: {
  scrape: ScrapeKey
  bingeGroup?: string
  onStage?: (stage: ResolveStage) => void
}): Promise<RaceResult> {
  args.onStage?.('finding')
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
      args.onStage?.('opening')
      const url = await resolveStreamUrl({ stream, context })
      args.onStage?.('starting')
      await probePlayable(url, stream.videoSize, ctrl.signal)
      return { stream, url }
    } catch (e) {
      console.warn('[stream] candidate rejected', stream.filename ?? stream.name, e)
      lastErr = e
    } finally {
      window.clearTimeout(timeoutId)
    }
  }
  throw lastErr ?? new Error('stream resolution failed')
}
