import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

const HISTORY_MAX = 20
const USER_RESULTS_MAX = 5
const RECENT_DEFAULT = 4

const itemKindValidator = v.union(
  v.literal('movie'),
  v.literal('tv'),
  v.literal('person'),
  v.literal('user')
)

export const recentSearches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return []
    return await ctx.db
      .query('searchHistory')
      .withIndex('by_userId_and_queriedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit ?? RECENT_DEFAULT)
  }
})

export const recordSearchHistory = mutation({
  args: {
    kind: itemKindValidator,
    tmdbId: v.optional(v.number()),
    username: v.optional(v.string()),
    title: v.string(),
    subtitle: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    avatarUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return

    const all = await ctx.db
      .query('searchHistory')
      .withIndex('by_userId_and_queriedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()

    const dup = all.find((item) => sameRef(item, args))
    if (dup) await ctx.db.delete(dup._id)

    await ctx.db.insert('searchHistory', {
      userId,
      kind: args.kind,
      tmdbId: args.tmdbId,
      username: args.username,
      title: args.title,
      subtitle: args.subtitle,
      posterPath: args.posterPath,
      avatarUrl: args.avatarUrl,
      queriedAt: Date.now()
    })

    if (all.length >= HISTORY_MAX) {
      const overflow = all.slice(HISTORY_MAX - 1)
      await Promise.all(overflow.map((item) => ctx.db.delete(item._id)))
    }
  }
})

export const removeSearchHistoryItem = mutation({
  args: { itemId: v.id('searchHistory') },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return
    const item = await ctx.db.get(itemId)
    if (!item || item.userId !== userId) return
    await ctx.db.delete(itemId)
  }
})

export const clearSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return
    const all = await ctx.db
      .query('searchHistory')
      .withIndex('by_userId_and_queriedAt', (q) => q.eq('userId', userId))
      .collect()
    await Promise.all(all.map((item) => ctx.db.delete(item._id)))
  }
})

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const term = q.trim()
    if (term.length === 0) return []

    const [byUser, byName] = await Promise.all([
      ctx.db
        .query('profiles')
        .withSearchIndex('search_username', (s) => s.search('username', term))
        .take(USER_RESULTS_MAX),
      ctx.db
        .query('profiles')
        .withSearchIndex('search_displayName', (s) => s.search('displayName', term))
        .take(USER_RESULTS_MAX)
    ])

    const merged = new Map<string, Doc<'profiles'>>()
    for (const p of [...byUser, ...byName]) {
      if (p.visibility === 'hidden') continue
      if (!merged.has(p._id)) merged.set(p._id, p)
    }
    return Array.from(merged.values()).slice(0, USER_RESULTS_MAX)
  }
})

function sameRef(
  item: Doc<'searchHistory'>,
  args: { kind: string; tmdbId?: number; username?: string }
): boolean {
  if (item.kind !== args.kind) return false
  if (args.kind === 'user') return item.username === args.username
  return item.tmdbId === args.tmdbId
}
