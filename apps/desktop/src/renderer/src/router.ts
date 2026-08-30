import { createHashHistory, createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
}

export interface RouterContext {
  queryClient: QueryClient
  auth: AuthState
}

const SEVEN_DAYS = 7 * 24 * 60 * 60_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: SEVEN_DAYS,
      refetchOnWindowFocus: false,
      retry: (failureCount, err) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (/\b(401|403|404)\b/.test(msg)) return false
        return failureCount < 1
      }
    }
  }
})

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: {
    queryClient,
    auth: { isLoading: true, isAuthenticated: false }
  } satisfies RouterContext,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  defaultViewTransition: false
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
