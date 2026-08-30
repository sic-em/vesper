import { convexClient } from './convex-client'
import { api } from '@convex/_generated/api'

export interface FanartImage {
  id: string
  url: string
  lang: string
  likes: string
}

export interface FanartMovie {
  name: string
  tmdb_id?: string
  imdb_id?: string
  hdmovielogo?: FanartImage[]
  movielogo?: FanartImage[]
  moviedisc?: FanartImage[]
  moviebackground?: FanartImage[]
  movieposter?: FanartImage[]
}

export interface FanartTv {
  name: string
  thetvdb_id?: string
  hdtvlogo?: FanartImage[]
  clearlogo?: FanartImage[]
  tvthumb?: FanartImage[]
  showbackground?: FanartImage[]
  tvposter?: FanartImage[]
}

async function fanart<T>(path: string): Promise<T | null> {
  try {
    const result = await convexClient.action(api.fanart.fetchEndpoint, { path })
    return result as T | null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[fanart] ${path}`, msg)
    throw err
  }
}

export function fanartMovie(idOrImdb: string | number): Promise<FanartMovie | null> {
  return fanart<FanartMovie>(`/movies/${idOrImdb}`)
}

export function fanartTv(tvdbId: string | number): Promise<FanartTv | null> {
  return fanart<FanartTv>(`/tv/${tvdbId}`)
}

export function pickFanartLogo(images: FanartImage[] | undefined, lang = 'en'): string | undefined {
  if (!images?.length) return undefined
  const en = images.filter((i) => i.lang === lang).sort((a, b) => Number(b.likes) - Number(a.likes))
  return (en[0] ?? images[0])?.url
}
