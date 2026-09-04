import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'

const SERIESGRAPH_BASE = 'https://seriesgraph.com/api'
const TTL_MS = 12 * 60 * 60 * 1000

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

const seasonsValidator = v.array(
  v.object({
    season: v.number(),
    episodes: v.array(
      v.object({
        episode: v.number(),
        name: v.optional(v.string()),
        rating: v.optional(v.number()),
        votes: v.optional(v.number()),
        airDate: v.optional(v.string())
      })
    )
  })
)

interface RawEpisode {
  episode_number: number
  tmdb_episode_number?: number | null
  name?: string | null
  imdb_rating?: number | null
  imdb_votes?: number | null
  air_date?: string | null
}

interface RawSeason {
  season_number: number
  tmdb_season_number?: number | null
  episodes?: RawEpisode[] | null
}

// The raw response carries stills, overviews and per-episode vote histograms;
// keep only what the graph plots so cached docs stay small.
function trim(raw: RawSeason[]): SeasonRatings[] {
  return raw.map((s) => ({
    season: s.tmdb_season_number ?? s.season_number,
    episodes: (s.episodes ?? []).map((e) => ({
      episode: e.tmdb_episode_number ?? e.episode_number,
      name: e.name ?? undefined,
      rating: e.imdb_rating ?? undefined,
      votes: e.imdb_votes ?? undefined,
      airDate: e.air_date ?? undefined
    }))
  }))
}

export const getCached = internalQuery({
  args: { tmdbId: v.number() },
  handler: async (ctx, { tmdbId }): Promise<Doc<'seriesgraphRatings'> | null> => {
    return await ctx.db
      .query('seriesgraphRatings')
      .withIndex('by_tmdbId', (q) => q.eq('tmdbId', tmdbId))
      .unique()
  }
})

export const store = internalMutation({
  args: { tmdbId: v.number(), seasons: seasonsValidator },
  handler: async (ctx, { tmdbId, seasons }) => {
    const existing = await ctx.db
      .query('seriesgraphRatings')
      .withIndex('by_tmdbId', (q) => q.eq('tmdbId', tmdbId))
      .unique()
    const fields = { seasons, fetchedAt: Date.now() }
    if (existing) await ctx.db.patch(existing._id, fields)
    else await ctx.db.insert('seriesgraphRatings', { tmdbId, ...fields })
  }
})

export const fetchSeasonRatings = action({
  args: { tmdbId: v.number() },
  handler: async (ctx, { tmdbId }): Promise<SeasonRatings[] | null> => {
    if ((await getAuthUserId(ctx)) === null) throw new Error('Not authenticated')
    const cached = await ctx.runQuery(internal.seriesgraph.getCached, { tmdbId })
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.seasons

    let raw: RawSeason[]
    try {
      const res = await fetch(`${SERIESGRAPH_BASE}/shows/${tmdbId}/season-ratings`, {
        headers: { Referer: `https://seriesgraph.com/show/${tmdbId}` }
      })
      if (!res.ok) throw new Error(`SeriesGraph ${res.status}`)
      raw = await res.json()
    } catch {
      // Stale beats nothing when SeriesGraph is down or rate-limited.
      return cached ? cached.seasons : null
    }
    if (!Array.isArray(raw)) return cached ? cached.seasons : null

    const seasons = trim(raw)
    try {
      await ctx.runMutation(internal.seriesgraph.store, { tmdbId, seasons })
    } catch {
      // A show with thousands of episodes can exceed the document size cap;
      // serve the data uncached rather than failing the request.
    }
    return seasons
  }
})
