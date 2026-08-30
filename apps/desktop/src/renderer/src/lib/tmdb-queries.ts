import { queryOptions } from '@tanstack/react-query'
import {
  tmdb,
  type TmdbList,
  type TmdbMovie,
  type TmdbMovieDetails,
  type TmdbPersonCredits,
  type TmdbPersonDetails,
  type TmdbSearchMultiItem,
  type TmdbSeasonDetails,
  type TmdbShow,
  type TmdbTrendingItem,
  type TmdbTvDetails
} from './tmdb'
import { fanartMovie, fanartTv, type FanartMovie, type FanartTv } from './fanart'

const GENRES = {
  scifi: 878,
  horror: 27,
  comedy: 35,
  animation: 16,
  drama: 18,
  action: 28,
  thriller: 53,
  romance: 10749,
  fantasy: 14,
  crime: 80,
  mystery: 9648,
  adventure: 12,
  family: 10751
} as const

export type GenreKey = keyof typeof GENRES
export const GENRE_ID = (k: GenreKey): number => GENRES[k]

function lastNDays(n: number): { gte: string; lte: string } {
  const now = new Date()
  const past = new Date(now)
  past.setDate(now.getDate() - n)
  const fmt = (d: Date): string => d.toISOString().slice(0, 10)
  return { gte: fmt(past), lte: fmt(now) }
}

export const trendingMoviesQuery = () =>
  queryOptions({
    queryKey: ['tmdb', 'trending', 'movie', 'week'],
    queryFn: () => tmdb<TmdbList<TmdbMovie>>('/trending/movie/week'),
    staleTime: 30 * 60_000
  })

export const trendingTvQuery = () =>
  queryOptions({
    queryKey: ['tmdb', 'trending', 'tv', 'week'],
    queryFn: () => tmdb<TmdbList<TmdbShow>>('/trending/tv/week'),
    staleTime: 30 * 60_000
  })

export const topRatedMoviesQuery = () =>
  queryOptions({
    queryKey: ['tmdb', 'movie', 'top_rated'],
    queryFn: () => tmdb<TmdbList<TmdbMovie>>('/movie/top_rated'),
    staleTime: 60 * 60_000
  })

export const popularMoviesQuery = (page = 1) =>
  queryOptions({
    queryKey: ['tmdb', 'movie', 'popular', page],
    queryFn: () => tmdb<TmdbList<TmdbMovie>>('/movie/popular', { page }),
    staleTime: 60 * 60_000
  })

export const topMoviesRecentQuery = () => {
  const now = new Date()
  const past = new Date(now)
  past.setMonth(now.getMonth() - 3)
  const fmt = (d: Date): string => d.toISOString().slice(0, 10)
  return queryOptions({
    queryKey: ['tmdb', 'movie', 'discover', 'top-recent', fmt(past), fmt(now)],
    queryFn: () =>
      tmdb<TmdbList<TmdbMovie>>('/discover/movie', {
        sort_by: 'vote_average.desc',
        'primary_release_date.gte': fmt(past),
        'primary_release_date.lte': fmt(now),
        'vote_count.gte': 100,
        include_adult: false
      }),
    staleTime: 60 * 60_000
  })
}

export const topTvRecentQuery = () => {
  const now = new Date()
  const past = new Date(now)
  past.setMonth(now.getMonth() - 3)
  const fmt = (d: Date): string => d.toISOString().slice(0, 10)
  return queryOptions({
    queryKey: ['tmdb', 'tv', 'discover', 'top-recent', fmt(past), fmt(now)],
    queryFn: () =>
      tmdb<TmdbList<TmdbShow>>('/discover/tv', {
        sort_by: 'vote_average.desc',
        'first_air_date.gte': fmt(past),
        'first_air_date.lte': fmt(now),
        'vote_count.gte': 100,
        include_adult: false
      }),
    staleTime: 60 * 60_000
  })
}

export const trendingAllQuery = () =>
  queryOptions({
    queryKey: ['tmdb', 'trending', 'all', 'week'],
    queryFn: () => tmdb<TmdbList<TmdbTrendingItem>>('/trending/all/week'),
    staleTime: 30 * 60_000
  })

export const newMoviesRecentQuery = () => {
  const { gte, lte } = lastNDays(7)
  return queryOptions({
    queryKey: ['tmdb', 'movie', 'discover', 'new', gte, lte],
    queryFn: () =>
      tmdb<TmdbList<TmdbMovie>>('/discover/movie', {
        sort_by: 'popularity.desc',
        'primary_release_date.gte': gte,
        'primary_release_date.lte': lte,
        'vote_count.gte': 5,
        include_adult: false
      }),
    staleTime: 30 * 60_000
  })
}

export const newTvRecentQuery = () => {
  const { gte, lte } = lastNDays(7)
  return queryOptions({
    queryKey: ['tmdb', 'tv', 'discover', 'new', gte, lte],
    queryFn: () =>
      tmdb<TmdbList<TmdbShow>>('/discover/tv', {
        sort_by: 'popularity.desc',
        'first_air_date.gte': gte,
        'first_air_date.lte': lte,
        'vote_count.gte': 5,
        include_adult: false
      }),
    staleTime: 30 * 60_000
  })
}

export const genreMoviesQuery = (genre: GenreKey) =>
  queryOptions({
    queryKey: ['tmdb', 'movie', 'discover', 'genre', genre],
    queryFn: () =>
      tmdb<TmdbList<TmdbMovie>>('/discover/movie', {
        with_genres: GENRES[genre],
        sort_by: 'popularity.desc',
        'vote_count.gte': 100,
        include_adult: false
      }),
    staleTime: 6 * 60 * 60_000
  })

export const tvDetailsQuery = (id: number) =>
  queryOptions({
    queryKey: ['tmdb', 'tv', id, 'details'],
    queryFn: () =>
      tmdb<TmdbTvDetails>(`/tv/${id}`, {
        append_to_response: 'images,content_ratings,credits,videos,recommendations,external_ids',
        include_image_language: 'en,null'
      }),
    staleTime: 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const tvSeasonQuery = (tvId: number, seasonNumber: number) =>
  queryOptions({
    queryKey: ['tmdb', 'tv', tvId, 'season', seasonNumber],
    queryFn: () => tmdb<TmdbSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`),
    staleTime: 60 * 60_000,
    enabled: Number.isFinite(tvId) && tvId > 0 && Number.isFinite(seasonNumber) && seasonNumber >= 0
  })

export const movieDetailsQuery = (id: number) =>
  queryOptions({
    queryKey: ['tmdb', 'movie', id, 'details'],
    queryFn: () =>
      tmdb<TmdbMovieDetails>(`/movie/${id}`, {
        append_to_response: 'images,release_dates,credits,videos,recommendations',
        include_image_language: 'en,null'
      }),
    staleTime: 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const personDetailsQuery = (id: number) =>
  queryOptions({
    queryKey: ['tmdb', 'person', id, 'details'],
    queryFn: () => tmdb<TmdbPersonDetails>(`/person/${id}`),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const personCombinedCreditsQuery = (id: number) =>
  queryOptions({
    queryKey: ['tmdb', 'person', id, 'combined_credits'],
    queryFn: () => tmdb<TmdbPersonCredits>(`/person/${id}/combined_credits`),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const searchMultiQuery = (query: string) =>
  queryOptions({
    queryKey: ['tmdb', 'search', 'multi', query],
    queryFn: () =>
      tmdb<TmdbList<TmdbSearchMultiItem>>('/search/multi', {
        query,
        include_adult: false
      }),
    staleTime: 5 * 60_000,
    enabled: query.trim().length > 0
  })

export const searchMoviesQuery = (query: string) =>
  queryOptions({
    queryKey: ['tmdb', 'search', 'movie', query],
    queryFn: () =>
      tmdb<TmdbList<TmdbMovie>>('/search/movie', {
        query,
        include_adult: false
      }),
    staleTime: 5 * 60_000,
    enabled: query.trim().length > 0
  })

export const searchTvQuery = (query: string) =>
  queryOptions({
    queryKey: ['tmdb', 'search', 'tv', query],
    queryFn: () =>
      tmdb<TmdbList<TmdbShow>>('/search/tv', {
        query,
        include_adult: false
      }),
    staleTime: 5 * 60_000,
    enabled: query.trim().length > 0
  })

export const searchPeopleQuery = (query: string) =>
  queryOptions({
    queryKey: ['tmdb', 'search', 'person', query],
    queryFn: () =>
      tmdb<TmdbList<TmdbSearchMultiItem>>('/search/person', {
        query,
        include_adult: false
      }),
    staleTime: 5 * 60_000,
    enabled: query.trim().length > 0
  })

export const trendingAllDayQuery = () =>
  queryOptions({
    queryKey: ['tmdb', 'trending', 'all', 'day'],
    queryFn: () => tmdb<TmdbList<TmdbTrendingItem>>('/trending/all/day'),
    staleTime: 30 * 60_000
  })

export const fanartMovieQuery = (idOrImdb: string | number | undefined) =>
  queryOptions({
    queryKey: ['fanart', 'movie', String(idOrImdb ?? '')],
    queryFn: (): Promise<FanartMovie | null> => fanartMovie(idOrImdb as string | number),
    staleTime: 24 * 60 * 60_000,
    enabled: !!idOrImdb
  })

export const fanartTvQuery = (tvdbId: string | number | undefined) =>
  queryOptions({
    queryKey: ['fanart', 'tv', String(tvdbId ?? '')],
    queryFn: (): Promise<FanartTv | null> => fanartTv(tvdbId as string | number),
    staleTime: 24 * 60 * 60_000,
    enabled: !!tvdbId
  })

export const movieRecommendationsQuery = (id: number, page = 1) =>
  queryOptions({
    queryKey: ['tmdb', 'movie', id, 'recommendations', page],
    queryFn: () => tmdb<TmdbList<TmdbMovie>>(`/movie/${id}/recommendations`, { page }),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const movieSimilarQuery = (id: number, page = 1) =>
  queryOptions({
    queryKey: ['tmdb', 'movie', id, 'similar', page],
    queryFn: () => tmdb<TmdbList<TmdbMovie>>(`/movie/${id}/similar`, { page }),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const tvRecommendationsQuery = (id: number, page = 1) =>
  queryOptions({
    queryKey: ['tmdb', 'tv', id, 'recommendations', page],
    queryFn: () => tmdb<TmdbList<TmdbShow>>(`/tv/${id}/recommendations`, { page }),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })

export const tvSimilarQuery = (id: number, page = 1) =>
  queryOptions({
    queryKey: ['tmdb', 'tv', id, 'similar', page],
    queryFn: () => tmdb<TmdbList<TmdbShow>>(`/tv/${id}/similar`, { page }),
    staleTime: 24 * 60 * 60_000,
    enabled: Number.isFinite(id) && id > 0
  })
