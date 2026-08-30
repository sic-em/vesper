import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'

const OMDB_BASE = 'https://www.omdbapi.com'
const TTL_MS = 24 * 60 * 60 * 1000

export interface OmdbRatings {
  imdb?: number
  imdbVotes?: number
  metacritic?: number
}

function num(s: string | undefined): number | undefined {
  if (!s || s === 'N/A') return undefined
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function toRatings(doc: { imdb?: number; imdbVotes?: number; metacritic?: number }): OmdbRatings {
  return { imdb: doc.imdb, imdbVotes: doc.imdbVotes, metacritic: doc.metacritic }
}

export const getCached = internalQuery({
  args: { imdbId: v.string() },
  handler: async (ctx, { imdbId }): Promise<Doc<'omdbRatings'> | null> => {
    return await ctx.db
      .query('omdbRatings')
      .withIndex('by_imdbId', (q) => q.eq('imdbId', imdbId))
      .unique()
  }
})

export const store = internalMutation({
  args: {
    imdbId: v.string(),
    imdb: v.optional(v.number()),
    imdbVotes: v.optional(v.number()),
    metacritic: v.optional(v.number())
  },
  handler: async (ctx, { imdbId, imdb, imdbVotes, metacritic }) => {
    const existing = await ctx.db
      .query('omdbRatings')
      .withIndex('by_imdbId', (q) => q.eq('imdbId', imdbId))
      .unique()
    const fields = { imdb, imdbVotes, metacritic, fetchedAt: Date.now() }
    if (existing) await ctx.db.patch(existing._id, fields)
    else await ctx.db.insert('omdbRatings', { imdbId, ...fields })
  }
})

export const fetchRatings = action({
  args: { imdbId: v.string() },
  handler: async (ctx, { imdbId }): Promise<OmdbRatings | null> => {
    if ((await getAuthUserId(ctx)) === null) throw new Error('Not authenticated')
    const cached = await ctx.runQuery(internal.omdb.getCached, { imdbId })
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return toRatings(cached)

    const key = process.env.OMDB_API_KEY
    if (!key) return cached ? toRatings(cached) : null

    let body: { Response?: string; imdbRating?: string; imdbVotes?: string; Metascore?: string }
    try {
      const res = await fetch(`${OMDB_BASE}/?apikey=${key}&i=${encodeURIComponent(imdbId)}`)
      if (!res.ok) throw new Error(`OMDb ${res.status}`)
      body = await res.json()
    } catch {
      // Stale beats nothing when OMDb is down or rate-limited.
      return cached ? toRatings(cached) : null
    }
    if (body.Response !== 'True') return cached ? toRatings(cached) : null

    const ratings: OmdbRatings = {
      imdb: num(body.imdbRating),
      imdbVotes: num(body.imdbVotes),
      metacritic: num(body.Metascore)
    }
    await ctx.runMutation(internal.omdb.store, { imdbId, ...ratings })
    return ratings
  }
})
