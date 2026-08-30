import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx
} from './_generated/server'
import { presence } from './presence'

type FriendshipDoc = Doc<'friendships'>

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new Error('Not authenticated')
  return userId
}

function canonicalPair(
  a: Id<'users'>,
  b: Id<'users'>
): { userIdA: Id<'users'>; userIdB: Id<'users'> } {
  return a < b ? { userIdA: a, userIdB: b } : { userIdA: b, userIdB: a }
}

async function findFriendship(
  ctx: QueryCtx,
  a: Id<'users'>,
  b: Id<'users'>
): Promise<FriendshipDoc | null> {
  const { userIdA, userIdB } = canonicalPair(a, b)
  return await ctx.db
    .query('friendships')
    .withIndex('by_userIdA_and_userIdB', (q) => q.eq('userIdA', userIdA).eq('userIdB', userIdB))
    .unique()
}

async function loadProfile(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'profiles'> | null> {
  return await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .unique()
}

export type FriendshipState =
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'accepted'
  | 'blocked_by_me'
  | 'blocked_by_them'

function deriveState(
  row: FriendshipDoc | null,
  me: Id<'users'>
): { state: FriendshipState; friendshipId?: Id<'friendships'> } {
  if (!row) return { state: 'none' }
  if (row.status === 'pending') {
    return {
      state: row.requestedBy === me ? 'pending_outgoing' : 'pending_incoming',
      friendshipId: row._id
    }
  }
  if (row.status === 'accepted') return { state: 'accepted', friendshipId: row._id }
  return {
    state: row.requestedBy === me ? 'blocked_by_me' : 'blocked_by_them',
    friendshipId: row._id
  }
}

export const stateWith = query({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return { state: 'none' as FriendshipState }
    if (me === otherUserId) return { state: 'none' as FriendshipState }
    const row = await findFriendship(ctx, me, otherUserId)
    return deriveState(row, me)
  }
})

export const sendRequest = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await requireUserId(ctx)
    if (me === otherUserId) throw new Error('Cannot friend yourself')

    const other = await ctx.db.get(otherUserId)
    if (!other) throw new Error('User not found')

    const existing = await findFriendship(ctx, me, otherUserId)
    if (existing) {
      if (existing.status === 'accepted') throw new Error('Already friends')
      if (existing.status === 'pending') throw new Error('Request already pending')
      if (existing.status === 'blocked') throw new Error('Cannot send request')
    }

    const { userIdA, userIdB } = canonicalPair(me, otherUserId)
    const friendshipId = await ctx.db.insert('friendships', {
      userIdA,
      userIdB,
      status: 'pending',
      requestedBy: me,
      createdAt: Date.now()
    })

    const myProfile = await loadProfile(ctx, me)
    await ctx.db.insert('notifications', {
      userId: otherUserId,
      kind: 'friend_request',
      friendshipId,
      actorUserId: me,
      title: myProfile?.displayName,
      createdAt: Date.now()
    })

    return friendshipId
  }
})

export const cancelRequest = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await requireUserId(ctx)
    const row = await findFriendship(ctx, me, otherUserId)
    if (!row) return
    if (row.status !== 'pending') throw new Error('Not a pending request')
    if (row.requestedBy !== me) throw new Error('Not your request')

    await deleteRelatedNotifications(ctx, row._id)
    await ctx.db.delete(row._id)
  }
})

export const acceptRequest = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireUserId(ctx)
    const row = await ctx.db.get(friendshipId)
    if (!row) throw new Error('Request not found')
    if (row.status !== 'pending') throw new Error('Not pending')
    if (row.requestedBy === me) throw new Error('Cannot accept your own request')
    if (row.userIdA !== me && row.userIdB !== me) throw new Error('Not authorized')

    const now = Date.now()
    await ctx.db.patch(friendshipId, { status: 'accepted', acceptedAt: now })

    await deleteRelatedNotifications(ctx, friendshipId)

    const myProfile = await loadProfile(ctx, me)
    await ctx.db.insert('notifications', {
      userId: row.requestedBy,
      kind: 'friend_accept',
      friendshipId,
      actorUserId: me,
      title: myProfile?.displayName,
      createdAt: now
    })
  }
})

export const declineRequest = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireUserId(ctx)
    const row = await ctx.db.get(friendshipId)
    if (!row) return
    if (row.status !== 'pending') throw new Error('Not pending')
    if (row.requestedBy === me) throw new Error('Cannot decline your own request')
    if (row.userIdA !== me && row.userIdB !== me) throw new Error('Not authorized')

    await deleteRelatedNotifications(ctx, friendshipId)
    await ctx.db.delete(friendshipId)
  }
})

export const unfriend = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await requireUserId(ctx)
    const row = await findFriendship(ctx, me, otherUserId)
    if (!row) return
    if (row.status !== 'accepted') throw new Error('Not friends')

    await deleteRelatedNotifications(ctx, row._id)
    await ctx.db.delete(row._id)
  }
})

export const block = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await requireUserId(ctx)
    if (me === otherUserId) throw new Error('Cannot block yourself')

    const row = await findFriendship(ctx, me, otherUserId)
    const now = Date.now()
    if (row) {
      await deleteRelatedNotifications(ctx, row._id)
      await ctx.db.patch(row._id, { status: 'blocked', requestedBy: me, acceptedAt: undefined })
      return row._id
    }
    const { userIdA, userIdB } = canonicalPair(me, otherUserId)
    return await ctx.db.insert('friendships', {
      userIdA,
      userIdB,
      status: 'blocked',
      requestedBy: me,
      createdAt: now
    })
  }
})

export const unblock = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const me = await requireUserId(ctx)
    const row = await findFriendship(ctx, me, otherUserId)
    if (!row) return
    if (row.status !== 'blocked') throw new Error('Not blocked')
    if (row.requestedBy !== me) throw new Error('Not the blocker')
    await ctx.db.delete(row._id)
  }
})

async function collectFriendships(
  ctx: QueryCtx,
  me: Id<'users'>,
  status: FriendshipDoc['status']
): Promise<FriendshipDoc[]> {
  const asA = await ctx.db
    .query('friendships')
    .withIndex('by_userIdA_and_status', (q) => q.eq('userIdA', me).eq('status', status))
    .collect()
  const asB = await ctx.db
    .query('friendships')
    .withIndex('by_userIdB_and_status', (q) => q.eq('userIdB', me).eq('status', status))
    .collect()
  return [...asA, ...asB]
}

interface FriendListRow {
  friendshipId: Id<'friendships'>
  userId: Id<'users'>
  displayName: string
  username: string
  avatarUrl: string | undefined
  createdAt: number
}

async function enrichWithProfile(
  ctx: QueryCtx,
  rows: FriendshipDoc[],
  me: Id<'users'>
): Promise<FriendListRow[]> {
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const otherId = row.userIdA === me ? row.userIdB : row.userIdA
      const profile = await loadProfile(ctx, otherId)
      if (!profile) return null
      return {
        friendshipId: row._id,
        userId: otherId,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        createdAt: row.acceptedAt ?? row.createdAt
      }
    })
  )
  return enriched.filter((x): x is FriendListRow => x !== null)
}

export const listAccepted = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return []
    const rows = await collectFriendships(ctx, me, 'accepted')
    const enriched = await enrichWithProfile(ctx, rows, me)
    enriched.sort((a, b) => b.createdAt - a.createdAt)
    return enriched
  }
})

export const listIncoming = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return []
    const rows = await collectFriendships(ctx, me, 'pending')
    const incoming = rows.filter((r) => r.requestedBy !== me)
    const enriched = await enrichWithProfile(ctx, incoming, me)
    enriched.sort((a, b) => b.createdAt - a.createdAt)
    return enriched
  }
})

export const listOutgoing = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return []
    const rows = await collectFriendships(ctx, me, 'pending')
    const outgoing = rows.filter((r) => r.requestedBy === me)
    const enriched = await enrichWithProfile(ctx, outgoing, me)
    enriched.sort((a, b) => b.createdAt - a.createdAt)
    return enriched
  }
})

const WATCHING_FRESHNESS_MS = 60_000
const PAUSED_FRESHNESS_MS = 5 * 60_000

export type ActivityStatus = 'watching' | 'paused' | 'idle' | 'offline'

export const listActivity = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return []

    const friendships = await collectFriendships(ctx, me, 'accepted')
    const friendIds = friendships.map((f) => (f.userIdA === me ? f.userIdB : f.userIdA))
    if (friendIds.length === 0) return []

    const presenceList = await presence.listRoom(ctx, 'vesper', false, 200)
    const presenceMap = new Map(presenceList.map((p) => [p.userId, p]))

    const enriched = await Promise.all(
      friendIds.map(async (friendId) => {
        const profile = await loadProfile(ctx, friendId)
        if (!profile) return null

        const hidePresence = profile.hidePresence ?? false
        const hideActivity = profile.hideActivity ?? false

        const latest =
          hideActivity || hidePresence
            ? []
            : await ctx.db
                .query('playbackProgress')
                .withIndex('by_userId_and_updatedAt', (q) => q.eq('userId', friendId))
                .order('desc')
                .take(1)
        const playback = latest[0] ?? null

        const p = presenceMap.get(friendId as string)
        const online = hidePresence ? false : (p?.online ?? false)
        const lastDisconnected = p?.lastDisconnected ?? 0

        let status: ActivityStatus
        const age = playback ? Date.now() - playback.updatedAt : Infinity
        const watchFresh = age < WATCHING_FRESHNESS_MS
        const pausedFresh = age < PAUSED_FRESHNESS_MS
        if (!online) status = 'offline'
        else if (playback && playback.state === 'playing' && watchFresh) status = 'watching'
        else if (playback && playback.state === 'paused' && pausedFresh) status = 'paused'
        else status = 'idle'

        return {
          userId: friendId,
          displayName: profile.displayName,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          status,
          online,
          lastDisconnected,
          playback: playback
            ? {
                imdbId: playback.imdbId,
                mediaType: playback.mediaType,
                season: playback.season,
                episode: playback.episode,
                title: playback.title,
                tmdbId: playback.tmdbId,
                posterPath: playback.posterPath,
                backdropPath: playback.backdropPath,
                positionSec: playback.positionSec,
                durationSec: playback.durationSec,
                state: playback.state,
                updatedAt: playback.updatedAt
              }
            : null
        }
      })
    )

    const rows = enriched.filter((x): x is NonNullable<typeof x> => x !== null)
    const statusRank: Record<ActivityStatus, number> = {
      watching: 0,
      paused: 1,
      idle: 2,
      offline: 3
    }
    rows.sort((a, b) => {
      const r = statusRank[a.status] - statusRank[b.status]
      if (r !== 0) return r
      const ta = a.playback?.updatedAt ?? a.lastDisconnected ?? 0
      const tb = b.playback?.updatedAt ?? b.lastDisconnected ?? 0
      return tb - ta
    })
    return rows
  }
})

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (me === null) return { accepted: 0, incoming: 0, outgoing: 0 }
    const pending = await collectFriendships(ctx, me, 'pending')
    const accepted = await collectFriendships(ctx, me, 'accepted')
    return {
      accepted: accepted.length,
      incoming: pending.filter((r) => r.requestedBy !== me).length,
      outgoing: pending.filter((r) => r.requestedBy === me).length
    }
  }
})

async function deleteRelatedNotifications(
  ctx: MutationCtx,
  friendshipId: Id<'friendships'>
): Promise<void> {
  const notifs = await ctx.db
    .query('notifications')
    .filter((q) => q.eq(q.field('friendshipId'), friendshipId))
    .collect()
  await Promise.all(notifs.map((n) => ctx.db.delete(n._id)))
}

export const deleteAllForUser = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const asA = await ctx.db
      .query('friendships')
      .withIndex('by_userIdA_and_userIdB', (q) => q.eq('userIdA', userId))
      .collect()
    const asB = await ctx.db
      .query('friendships')
      .filter((q) => q.eq(q.field('userIdB'), userId))
      .collect()
    await Promise.all([...asA, ...asB].map((r) => ctx.db.delete(r._id)))
  }
})
