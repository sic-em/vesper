import Discord from '@auth/core/providers/discord'
import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'
import { internal } from './_generated/api'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string | undefined) ?? ''
        }
      }
    }),
    Discord
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      if (redirectTo.startsWith('vesper://')) return redirectTo
      const base = (process.env.SITE_URL ?? '').replace(/\/$/, '')
      if (redirectTo.startsWith('?') || redirectTo.startsWith('/')) return `${base}${redirectTo}`
      if (base && redirectTo.startsWith(base)) return redirectTo
      throw new Error(`Invalid redirectTo: ${redirectTo}`)
    },
    async afterUserCreatedOrUpdated(ctx, args) {
      await ctx.scheduler.runAfter(0, internal.profiles.ensureForUser, {
        userId: args.userId
      })
      await ctx.scheduler.runAfter(0, internal.lists.ensureLikedForUser, {
        userId: args.userId
      })
      await ctx.scheduler.runAfter(0, internal.lists.ensureWatchedForUser, {
        userId: args.userId
      })
    }
  }
})
