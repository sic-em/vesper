import { internalQuery } from './_generated/server'
import { presence } from './presence'

const WATCHING_FRESHNESS_MS = 60_000
const PAUSED_FRESHNESS_MS = 5 * 60_000

type ActivityStatus = 'watching' | 'paused' | 'idle' | 'offline'

export const allUsersActivity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query('profiles').collect()

    const presenceList = await presence.listRoom(ctx, 'vesper', false, 500)
    const presenceMap = new Map(presenceList.map((p) => [p.userId, p]))

    const rows = await Promise.all(
      profiles.map(async (profile) => {
        const userId = profile.userId
        const latest = await ctx.db
          .query('playbackProgress')
          .withIndex('by_userId_and_updatedAt', (q) => q.eq('userId', userId))
          .order('desc')
          .take(1)
        const playback = latest[0] ?? null

        const p = presenceMap.get(userId as string)
        const online = p?.online ?? false
        const lastDisconnected = p?.lastDisconnected ?? 0

        const age = playback ? Date.now() - playback.updatedAt : Infinity
        let status: ActivityStatus
        if (!online) status = 'offline'
        else if (playback && playback.state === 'playing' && age < WATCHING_FRESHNESS_MS)
          status = 'watching'
        else if (playback && playback.state === 'paused' && age < PAUSED_FRESHNESS_MS)
          status = 'paused'
        else status = 'idle'

        return {
          userId,
          displayName: profile.displayName,
          username: profile.username,
          hidePresence: profile.hidePresence ?? false,
          hideActivity: profile.hideActivity ?? false,
          status,
          online,
          lastDisconnected,
          playback: playback
            ? {
                title: playback.title ?? playback.imdbId,
                mediaType: playback.mediaType,
                season: playback.season,
                episode: playback.episode,
                state: playback.state,
                positionSec: playback.positionSec,
                durationSec: playback.durationSec,
                updatedAt: playback.updatedAt
              }
            : null
        }
      })
    )

    const order = { watching: 0, paused: 1, idle: 2, offline: 3 }
    rows.sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return a.username.localeCompare(b.username)
    })
    return rows
  }
})
