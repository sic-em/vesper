import { convexClient } from './convex-client'
import { api } from '@convex/_generated/api'

// Ratings come from OMDb via a Convex action: the key stays server-side and
// results are cached per title, so every client shares one daily quota.
export interface ImdbRatings {
  imdb?: number
  imdbVotes?: number
  metacritic?: number
}

export async function fetchImdbRatings(imdbId: string): Promise<ImdbRatings | null> {
  return convexClient.action(api.omdb.fetchRatings, { imdbId })
}

export function pickImdb(r: ImdbRatings | null | undefined): string | undefined {
  if (!r?.imdb) return undefined
  return r.imdb.toFixed(1)
}

export function pickMetacritic(r: ImdbRatings | null | undefined): number | undefined {
  return r?.metacritic
}
