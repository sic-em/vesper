import { ConvexError, v } from 'convex/values'
import { MINUTE, DAY, RateLimiter, SECOND } from '@convex-dev/rate-limiter'
import { getAuthUserId } from '@convex-dev/auth/server'
import { action } from './_generated/server'
import { components } from './_generated/api'

const MAX_MSG = 4000
const MIN_MSG = 5

const rateLimiter = new RateLimiter(components.rateLimiter, {
  feedbackBurst: { kind: 'token bucket', rate: 1, period: 30 * SECOND, capacity: 1 },
  feedbackDaily: { kind: 'fixed window', rate: 20, period: DAY }
})

function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16)
}

export const submit = action({
  args: {
    message: v.string(),
    type: v.union(v.literal('bug'), v.literal('feature'), v.literal('other')),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    route: v.optional(v.string()),
    platform: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('Please sign in to send feedback.')

    const msg = args.message.trim()
    if (msg.length < MIN_MSG) {
      throw new ConvexError(`Your message is a bit short — add a few more details.`)
    }
    if (msg.length > MAX_MSG) {
      throw new ConvexError(`That's a lot to say! Please keep it under ${MAX_MSG} characters.`)
    }

    // Burst guard: 1 per 30s per user.
    {
      const r = await rateLimiter.limit(ctx, 'feedbackBurst', { key: userId })
      if (!r.ok) {
        const wait = Math.ceil((r.retryAfter ?? 30000) / 1000)
        throw new ConvexError(
          `Whoa, slow down — you can send another message in ${wait} second${wait === 1 ? '' : 's'}.`
        )
      }
    }
    // Daily quota: 20 per user.
    {
      const r = await rateLimiter.limit(ctx, 'feedbackDaily', { key: userId })
      if (!r.ok) {
        throw new ConvexError(
          `You've hit today's feedback limit. Try again tomorrow — we appreciate the enthusiasm!`
        )
      }
    }
    // Dedupe identical message within 5 min per user.
    {
      const hash = fnv1a(msg.toLowerCase())
      const r = await rateLimiter.limit(ctx, 'feedbackDedupe', {
        key: `${userId}:${hash}`,
        config: { kind: 'fixed window', rate: 1, period: 5 * MINUTE }
      })
      if (!r.ok) return // silent success
    }

    const webhook = process.env.DISCORD_FEEDBACK_WEBHOOK
    if (!webhook) {
      console.error('DISCORD_FEEDBACK_WEBHOOK not configured')
      throw new ConvexError(`Feedback isn't set up yet. Please try again later.`)
    }

    const typeEmoji = args.type === 'bug' ? '🐛' : args.type === 'feature' ? '✨' : '💬'
    const typeLabel = args.type[0]!.toUpperCase() + args.type.slice(1)
    const color = args.type === 'bug' ? 0xe06c75 : args.type === 'feature' ? 0x98c379 : 0x61afef

    const fields: Array<{ name: string; value: string; inline: boolean }> = []
    if (args.username) {
      const who = args.displayName ? `${args.displayName} (@${args.username})` : `@${args.username}`
      fields.push({ name: 'User', value: who, inline: true })
    }
    if (args.platform) fields.push({ name: 'Platform', value: args.platform, inline: true })
    if (args.route) fields.push({ name: 'Route', value: args.route, inline: false })

    const body = {
      embeds: [
        {
          title: `${typeEmoji} ${typeLabel}`,
          description: msg,
          color,
          fields,
          timestamp: new Date().toISOString()
        }
      ]
    }

    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      console.error('Discord webhook failed', r.status, txt.slice(0, 200))
      throw new ConvexError(`Couldn't deliver your message. Please try again.`)
    }
  }
})
