'use node'

import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { action } from './_generated/server'

const BASE = 'https://webservice.fanart.tv/v3'

export const fetchEndpoint = action({
  args: {
    path: v.string()
  },
  handler: async (ctx, { path }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) throw new Error('Not authenticated')
    const key = process.env.FANART_API_KEY
    if (!key) throw new Error('Fanart: no API key configured')
    const url = new URL(`${BASE}${path}`)
    url.searchParams.set('api_key', key)
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Fanart ${res.status} ${path}`)
    return await res.json()
  }
})
