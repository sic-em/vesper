import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { internalAction, internalMutation } from './_generated/server'
import { presence } from './presence'

const ROOM = 'vesper'
const REARM_MS = 5 * 60 * 1000
// Reserved row marking that the first sweep has run; lets a genuinely-first
// online user fire, while still suppressing whoever was already online at deploy.
const INIT_MARKER = '__init__'

export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const online = await presence.listRoom(ctx, ROOM, true, 1000)
    const onlineIds = new Set(online.map((e) => e.userId))
    const now = Date.now()

    // First sweep ever: seed the snapshot without firing, so whoever was
    // already online at deploy doesn't get announced. Gated on a marker row,
    // not table emptiness — otherwise the genuinely-first online user (arriving
    // when the table is still empty) would be swallowed every time.
    const marker = await ctx.db
      .query('presenceMonitor')
      .withIndex('by_userId', (q) => q.eq('userId', INIT_MARKER))
      .unique()
    const isFirstRun = marker === null
    if (isFirstRun) {
      await ctx.db.insert('presenceMonitor', {
        userId: INIT_MARKER,
        online: false,
        lastOfflineAt: 0
      })
    }

    const toNotify: string[] = []
    for (const userId of onlineIds) {
      const row = await ctx.db
        .query('presenceMonitor')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .unique()
      if (!row) {
        await ctx.db.insert('presenceMonitor', { userId, online: true, lastOfflineAt: 0 })
        if (!isFirstRun) toNotify.push(userId)
      } else if (!row.online) {
        await ctx.db.patch(row._id, { online: true })
        if (now - row.lastOfflineAt >= REARM_MS) toNotify.push(userId)
      }
    }

    const wereOnline = await ctx.db
      .query('presenceMonitor')
      .withIndex('by_online', (q) => q.eq('online', true))
      .collect()
    for (const row of wereOnline) {
      if (!onlineIds.has(row.userId)) {
        await ctx.db.patch(row._id, { online: false, lastOfflineAt: now })
      }
    }

    if (toNotify.length === 0) return

    const users: Array<{ displayName: string; username: string }> = []
    for (const userId of toNotify) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', userId as Id<'users'>))
        .unique()
      if (!profile || profile.hidePresence) continue
      users.push({ displayName: profile.displayName, username: profile.username })
    }
    if (users.length > 0) {
      await ctx.scheduler.runAfter(0, internal.presenceMonitor.postWebhook, { users })
    }
  }
})

export const postWebhook = internalAction({
  args: {
    users: v.array(v.object({ displayName: v.string(), username: v.string() }))
  },
  handler: async (_ctx, { users }) => {
    const webhook = process.env.DISCORD_PRESENCE_WEBHOOK
    if (!webhook) {
      console.error('DISCORD_PRESENCE_WEBHOOK not configured')
      return
    }
    const content = users
      .map((u) => `🟢 **${u.displayName}** (@${u.username}) came online`)
      .join('\n')
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      console.error('Presence webhook failed', r.status, txt.slice(0, 200))
    }
  }
})
