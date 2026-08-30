import { resolveStream, type ParsedStream } from './comet'

export interface StreamContext {
  mediaType: 'movie' | 'tv'
  imdbId: string
  season?: number
  episode?: number
  tmdbId?: number
}

// Resolve a picked Stream to a playable URL: the Convex action follows Comet's redirect
// and returns the bare Real-Debrid CDN link (no API key). Direct https — no local sidecar.
export async function resolveStreamUrl(args: {
  stream: ParsedStream
  context: StreamContext
}): Promise<string> {
  const { stream, context } = args
  return resolveStream({
    type: context.mediaType === 'tv' ? 'series' : 'movie',
    imdbId: context.imdbId,
    season: context.season,
    episode: context.episode,
    tmdbId: context.tmdbId,
    playbackHash: stream.playbackHash,
    source: stream.source
  })
}
