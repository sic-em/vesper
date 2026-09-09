// Web players: embed hosts that carry titles debrid refuses to touch
// (ADR-0018). Each one is a URL template keyed by TMDB id; the playable
// playlist is extracted in the main process by loading the page hidden and
// catching the request it makes. Ordered by how reliably each host answered
// when this list was written — the player walks it top to bottom.

export interface WebSource {
  id: string
  name: string
  movie: (tmdbId: number) => string
  tv: (tmdbId: number, season: number, episode: number) => string
}

export const WEB_SOURCES: WebSource[] = [
  {
    id: 'vidsrc-su',
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.su/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    movie: (id) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`
  },
  {
    id: 'videasy',
    name: 'Videasy',
    movie: (id) => `https://player.videasy.net/movie/${id}?autoplay=true`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?autoplay=true`
  },
  {
    id: 'vidcore',
    name: 'VidCore',
    movie: (id) => `https://vidcore.net/movie/${id}?autoplay=true`,
    tv: (id, s, e) => `https://vidcore.net/tv/${id}/${s}/${e}?autoplay=true`
  },
  {
    id: 'vidsrc-wtf',
    name: 'VidSrc 2',
    movie: (id) => `https://www.vidsrc.wtf/api/1/movie/?id=${id}`,
    tv: (id, s, e) => `https://www.vidsrc.wtf/api/1/tv/?id=${id}&s=${s}&e=${e}`
  }
]

export function webSourceById(id: string): WebSource | undefined {
  return WEB_SOURCES.find((s) => s.id === id)
}

export function webEmbedUrl(
  source: WebSource,
  args: { mediaType: 'movie' | 'tv'; tmdbId: number; season?: number; episode?: number }
): string {
  if (args.mediaType === 'movie') return source.movie(args.tmdbId)
  return source.tv(args.tmdbId, args.season ?? 1, args.episode ?? 1)
}
