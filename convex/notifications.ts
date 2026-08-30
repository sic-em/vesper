import { getAuthUserId } from '@convex-dev/auth/server'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx
} from './_generated/server'

const POPOVER_LIMIT = 20
const TTL_MS = 30 * 24 * 60 * 60 * 1000

async function requireUserId(ctx: MutationCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new Error('Not authenticated')
  return userId
}

type NotifDoc = Doc<'notifications'>

interface EnrichedNotif {
  _id: Id<'notifications'>
  kind: NotifDoc['kind']
  friendshipId?: Id<'friendships'>
  actor?: { userId: Id<'users'>; displayName: string; username: string; avatarUrl?: string }
  listId?: Id<'lists'>
  listName?: string
  tmdbId?: number
  mediaType?: NotifDoc['mediaType']
  season?: number
  episode?: number
  title?: string
  posterPath?: string
  imdbId?: string
  playbackHash?: string
  readAt?: number
  createdAt: number
}

async function enrich(ctx: QueryCtx, row: NotifDoc): Promise<EnrichedNotif> {
  let actor: EnrichedNotif['actor']
  if (row.actorUserId) {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', row.actorUserId!))
      .unique()
    if (profile) {
      actor = {
        userId: row.actorUserId,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl
      }
    }
  }
  return {
    _id: row._id,
    kind: row.kind,
    friendshipId: row.friendshipId,
    actor,
    listId: row.listId,
    listName: row.listName,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    season: row.season,
    episode: row.episode,
    title: row.title,
    posterPath: row.posterPath,
    imdbId: row.imdbId,
    playbackHash: row.playbackHash,
    readAt: row.readAt,
    createdAt: row.createdAt
  }
}

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return []
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_createdAt', (q) => q.eq('userId', me))
      .order('desc')
      .take(POPOVER_LIMIT)
    return await Promise.all(rows.map((r) => enrich(ctx, r)))
  }
})

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return { page: [], isDone: true, continueCursor: '' }
    const result = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_createdAt', (q) => q.eq('userId', me))
      .order('desc')
      .paginate(paginationOpts)
    const page = await Promise.all(result.page.map((r) => enrich(ctx, r)))
    return { ...result, page }
  }
})

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return 0
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_readAt', (q) => q.eq('userId', me).eq('readAt', undefined))
      .collect()
    return rows.length
  }
})

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const me = await requireUserId(ctx)
    const row = await ctx.db.get(notificationId)
    if (!row || row.userId !== me) return
    if (row.readAt !== undefined) return
    await ctx.db.patch(notificationId, { readAt: Date.now() })
  }
})

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireUserId(ctx)
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_readAt', (q) => q.eq('userId', me).eq('readAt', undefined))
      .collect()
    const now = Date.now()
    await Promise.all(rows.map((r) => ctx.db.patch(r._id, { readAt: now })))
  }
})

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireUserId(ctx)
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_createdAt', (q) => q.eq('userId', me))
      .collect()
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)))
  }
})

export const dismiss = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const me = await requireUserId(ctx)
    const row = await ctx.db.get(notificationId)
    if (!row || row.userId !== me) return
    await ctx.db.delete(notificationId)
  }
})

export const pruneOld = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TTL_MS
    const stale = await ctx.db
      .query('notifications')
      .filter((q) => q.lt(q.field('createdAt'), cutoff))
      .collect()
    await Promise.all(stale.map((r) => ctx.db.delete(r._id)))
    return stale.length
  }
})
