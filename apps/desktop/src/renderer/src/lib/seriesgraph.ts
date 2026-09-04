import { convexClient } from './convex-client'
import { api } from '@convex/_generated/api'

// Per-episode IMDb ratings come from SeriesGraph via a Convex action: results
// are cached per show server-side, so every client shares one fetch per window.
export interface EpisodeRating {
  episode: number
  name?: string
  rating?: number
  votes?: number
  airDate?: string
}

export interface SeasonRatings {
  season: number
  episodes: EpisodeRating[]
}

export async function fetchSeasonRatings(tmdbId: number): Promise<SeasonRatings[] | null> {
  return convexClient.action(api.seriesgraph.fetchSeasonRatings, { tmdbId })
}
