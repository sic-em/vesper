const TMDB_BASE = "https://api.themoviedb.org/3"
const IMG_BASE = "https://image.tmdb.org/t/p"

export interface TmdbGenre {
  id: number
  name: string
}
export interface TmdbCastMember {
  id: number
  name: string
  character?: string
  profile_path: string | null
  order?: number
}
export interface TmdbCredits {
  cast?: TmdbCastMember[]
}

export interface TmdbMovie {
  id: number
  title: string
  overview: string
  tagline?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  runtime?: number
  vote_average?: number
  genres?: TmdbGenre[]
  credits?: TmdbCredits
}

export interface TmdbShow {
  id: number
  name: string
  overview: string
  tagline?: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
  episode_run_time?: number[]
  vote_average?: number
  genres?: TmdbGenre[]
  credits?: TmdbCredits
}

export interface TmdbEpisode {
  id: number
  name: string
  overview: string
  air_date: string | null
  episode_number: number
  season_number: number
  runtime?: number
  still_path: string | null
  vote_average?: number
}

const apiKey = (): string | undefined =>
  import.meta.env.VITE_TMDB_API_KEY ?? import.meta.env.TMDB_API_KEY

export async function getMovie(id: string | number): Promise<TmdbMovie | null> {
  const key = apiKey()
  if (!key) return null
  const r = await fetch(
    `${TMDB_BASE}/movie/${id}?api_key=${key}&append_to_response=credits`
  )
  if (!r.ok) return null
  return (await r.json()) as TmdbMovie
}

export async function getTv(id: string | number): Promise<TmdbShow | null> {
  const key = apiKey()
  if (!key) return null
  const r = await fetch(
    `${TMDB_BASE}/tv/${id}?api_key=${key}&append_to_response=credits`
  )
  if (!r.ok) return null
  return (await r.json()) as TmdbShow
}

export async function getEpisode(
  id: string | number,
  season: number,
  episode: number
): Promise<TmdbEpisode | null> {
  const key = apiKey()
  if (!key) return null
  const r = await fetch(
    `${TMDB_BASE}/tv/${id}/season/${season}/episode/${episode}?api_key=${key}`
  )
  if (!r.ok) return null
  return (await r.json()) as TmdbEpisode
}

export function still(
  path: string | null | undefined,
  size: "w300" | "w780" | "original" = "w780"
): string {
  if (!path) return "https://vespr.dev/og.jpg"
  return `${IMG_BASE}/${size}${path}`
}

export function profile(
  path: string | null | undefined,
  size: "w185" | "h632" = "w185"
): string {
  if (!path) return ""
  return `${IMG_BASE}/${size}${path}`
}

export function formatRuntime(min: number | undefined): string {
  if (!min || min <= 0) return ""
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function poster(
  path: string | null | undefined,
  size: "w500" | "w780" | "original" = "w780"
): string {
  if (!path) return "https://vespr.dev/og.jpg"
  return `${IMG_BASE}/${size}${path}`
}

export function backdrop(
  path: string | null | undefined,
  size: "w780" | "original" = "w780"
): string {
  if (!path) return "https://vespr.dev/og.jpg"
  return `${IMG_BASE}/${size}${path}`
}
