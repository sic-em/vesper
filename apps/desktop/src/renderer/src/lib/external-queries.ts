import { queryOptions } from '@tanstack/react-query'
import { fanartMovie, fanartTv, pickFanartLogo, type FanartMovie, type FanartTv } from './fanart'
import { fetchImdbRatings } from './imdb'
import { pickEnglishLogo, tmdb, type TmdbMovieDetails, type TmdbTvDetails } from './tmdb'

interface TmdbTvExternalIds {
  imdb_id: string | null
  tvdb_id: number | null
}

export const fanartMovieQuery = (id: string | number | undefined) =>
  queryOptions({
    queryKey: ['fanart', 'movie', id],
    queryFn: () => fanartMovie(id!),
    staleTime: 7 * 24 * 60 * 60_000,
    enabled: !!id
  })

export const fanartTvQuery = (tvdbId: number | undefined | null) =>
  queryOptions({
    queryKey: ['fanart', 'tv', tvdbId],
    queryFn: () => fanartTv(tvdbId!),
    staleTime: 7 * 24 * 60 * 60_000,
    enabled: !!tvdbId
  })

export const imdbRatingsQuery = (imdbId: string | undefined) =>
  queryOptions({
    queryKey: ['imdb-rating', imdbId],
    queryFn: () => fetchImdbRatings(imdbId!),
    staleTime: 7 * 24 * 60 * 60_000,
    enabled: !!imdbId
  })

export const tvExternalIdsQuery = (tvId: number | undefined) =>
  queryOptions({
    queryKey: ['tmdb', 'tv', tvId, 'external_ids'],
    queryFn: () => tmdb<TmdbTvExternalIds>(`/tv/${tvId}/external_ids`),
    staleTime: 7 * 24 * 60 * 60_000,
    enabled: !!tvId
  })

export function pickMovieHeroLogo(
  details: TmdbMovieDetails | undefined,
  fanart: FanartMovie | null | undefined
): string | undefined {
  const fanartLogo = pickFanartLogo(fanart?.hdmovielogo ?? fanart?.movielogo ?? undefined)
  return fanartLogo ?? (details ? pickEnglishLogo(details) : undefined)
}

export function pickTvHeroLogo(
  details: TmdbTvDetails | undefined,
  fanart: FanartTv | null | undefined
): string | undefined {
  const fanartLogo = pickFanartLogo(fanart?.hdtvlogo ?? fanart?.clearlogo ?? undefined)
  return (
    fanartLogo ??
    (details
      ? pickEnglishLogo(details as unknown as Parameters<typeof pickEnglishLogo>[0])
      : undefined)
  )
}

export function pickContinueCardLogo(fanart: FanartTv | null | undefined): string | undefined {
  return pickFanartLogo(fanart?.clearlogo ?? fanart?.hdtvlogo ?? undefined)
}

export function preloadImage(url: string | undefined): void {
  if (!url) return
  const img = new Image()
  img.src = url
}
