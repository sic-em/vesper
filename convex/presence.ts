import { getAuthUserId } from '@convex-dev/auth/server'
import { Presence } from '@convex-dev/presence'
import { v } from 'convex/values'
import { components } from './_generated/api'
import { mutation, query } from './_generated/server'

export const presence = new Presence(components.presence)

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number()
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const me = await getAuthUserId(ctx)
    if (me === null || me !== userId) throw new Error('Unauthorized')
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval)
  }
})

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken)
  }
})

export const listRoom = query({
  args: { roomId: v.string(), onlineOnly: v.optional(v.boolean()) },
  handler: async (ctx, { roomId, onlineOnly }) => {
    return await presence.listRoom(ctx, roomId, onlineOnly ?? false)
  }
})

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken)
  }
})
