'use node'

import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { action } from './_generated/server'

interface CometRawStream {
  name?: string
  title?: string
  description?: string
  url?: string
  behaviorHints?: {
    bingeGroup?: string
    filename?: string
    videoSize?: number
  }
}

type Source = 'comet' | 'torrentio'

export interface CometStream {
  playbackHash: string
  source: Source
  name: string
  description: string
  filename?: string
  videoSize: number
  bingeGroup?: string
  cached: boolean
}

const PLAYBACK_HASH_RE = /\/playback\/([a-f0-9]+)\//i
const TORRENTIO_HASH_RE = /\/realdebrid\/[^/]+\/([a-f0-9]{40})\//i
const TORRENTIO_SIZE_RE = /💾\s*([\d.]+)\s*(TB|GB|MB)/i

function sourceBase(source: Source): string | null {
  const b = source === 'comet' ? process.env.COMET_BASE : process.env.TORRENTIO_BASE
  return b ? b.replace(/\/$/, '') : null
}

function idPart(
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
): string {
  return type === 'series' && season !== undefined && episode !== undefined
    ? `${imdbId}:${season}:${episode}`
    : imdbId
}

function cometHash(s: CometRawStream): string | null {
  const fromUrl = s.url?.match(PLAYBACK_HASH_RE)?.[1]
  if (fromUrl) return fromUrl.toLowerCase()
  const fromBinge = s.behaviorHints?.bingeGroup?.split('|').at(-1)
  return fromBinge && /^[a-f0-9]{40}$/i.test(fromBinge) ? fromBinge.toLowerCase() : null
}

function torrentioHash(s: CometRawStream): string | null {
  return s.url?.match(TORRENTIO_HASH_RE)?.[1]?.toLowerCase() ?? null
}

function torrentioSize(title: string): number {
  const m = title.match(TORRENTIO_SIZE_RE)
  if (!m) return 0
  const n = parseFloat(m[1])
  const unit = m[2].toUpperCase()
  return unit === 'TB' ? n * 1e12 : unit === 'GB' ? n * 1e9 : n * 1e6
}

function parse(source: Source, s: CometRawStream): CometStream | null {
  const playbackHash = source === 'comet' ? cometHash(s) : torrentioHash(s)
  if (!playbackHash) return null
  const name = s.name ?? ''
  const description = s.description ?? s.title ?? ''
  return {
    playbackHash,
    source,
    name,
    description,
    filename: s.behaviorHints?.filename,
    videoSize:
      s.behaviorHints?.videoSize ?? (source === 'torrentio' ? torrentioSize(description) : 0),
    bingeGroup: s.behaviorHints?.bingeGroup,
    // Comet marks cached with ⚡; Torrentio with [RD+] (uncached is [RD download]).
    cached: source === 'comet' ? name.includes('⚡') : name.includes('[RD+]')
  }
}

async function fetchRaw(
  source: Source,
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
): Promise<CometRawStream[]> {
  const b = sourceBase(source)
  if (!b) return []
  const url = `${b}/stream/${type}/${encodeURIComponent(idPart(type, imdbId, season, episode))}.json`
  const r = await fetch(url, { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`${source} ${r.status} for ${type} ${imdbId}`)
  const body = (await r.json()) as { streams?: CometRawStream[] }
  return body.streams ?? []
}

async function fetchSource(
  source: Source,
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
): Promise<CometStream[]> {
  const raw = await fetchRaw(source, type, imdbId, season, episode)
  return raw.map((s) => parse(source, s)).filter((s): s is CometStream => s !== null)
}

// Convex caps function return arrays at 8192 elements; stay well under as a safety net.
const MAX_STREAMS = 4096

const streamArgs = {
  type: v.union(v.literal('movie'), v.literal('series')),
  imdbId: v.string(),
  season: v.optional(v.number()),
  episode: v.optional(v.number())
}

// Merge Comet + Torrentio, dedupe by infohash. Comet wins collisions (its RD calls go
// through the single ElfHosted IP); Torrentio fills gaps Comet hasn't scraped yet. One
// source erroring (e.g. Torrentio rate-limit) must not blank the list, hence allSettled.
export const fetchStreams = action({
  args: streamArgs,
  handler: async (ctx, { type, imdbId, season, episode }): Promise<CometStream[]> => {
    if ((await getAuthUserId(ctx)) === null) throw new Error('Not authenticated')
    const results = await Promise.allSettled([
      fetchSource('comet', type, imdbId, season, episode),
      fetchSource('torrentio', type, imdbId, season, episode)
    ])
    const out: CometStream[] = []
    const seen = new Set<string>()
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const s of r.value) {
        // Only cached streams play instantly — the client discards the rest. Dropping them
        // here keeps the payload small and stays under Convex's 8192 array-return limit
        // (popular titles return ~10k raw streams).
        if (!s.cached) continue
        if (seen.has(s.playbackHash)) continue
        seen.add(s.playbackHash)
        out.push(s)
      }
    }
    return out.slice(0, MAX_STREAMS)
  }
})

// Resolve a chosen stream to its bare Real-Debrid CDN link. The addon playback URL
// embeds the RD API key, so it must never reach the client — we follow its 302 here
// and hand back only the keyless CDN URL.
export const resolve = action({
  args: {
    ...streamArgs,
    playbackHash: v.string(),
    source: v.optional(v.union(v.literal('comet'), v.literal('torrentio')))
  },
  handler: async (
    ctx,
    { type, imdbId, season, episode, playbackHash, source }
  ): Promise<string> => {
    if ((await getAuthUserId(ctx)) === null) throw new Error('Not authenticated')
    const src: Source = source ?? 'comet'
    const raw = await fetchRaw(src, type, imdbId, season, episode)
    const hashOf = src === 'comet' ? cometHash : torrentioHash
    const match = raw.find((s) => hashOf(s) === playbackHash.toLowerCase())
    if (!match?.url) throw new Error('Stream no longer available')
    const r = await fetch(match.url, {
      method: 'GET',
      redirect: 'manual',
      headers: { Range: 'bytes=0-0' }
    })
    const location = r.headers.get('location')
    if (location) return location
    if (r.ok || r.status === 206) return match.url
    throw new Error(`${src} resolve failed: ${r.status}`)
  }
})
