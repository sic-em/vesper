import './assets/main.css'

import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { useIsRestoring } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'
import { LazyMotion, domAnimation } from 'motion/react'
import { Agentation } from 'agentation'
import { router, queryClient } from './router'
import { queryPersister } from './lib/query-persister'
import { Heartbeat } from './lib/presence'
import { TooltipProvider } from './components/ui/tooltip'
import { mountOpenUrlHandler, flushPendingDeepLink } from './lib/open-url-mount'
import { convexClient as convex } from './lib/convex-client'

mountOpenUrlHandler()

const CACHE_BUSTER = 'v2'
const CACHE_MAX_AGE = 7 * 24 * 60 * 60_000

function App(): React.JSX.Element | null {
  const auth = useConvexAuth()
  const restoring = useIsRestoring()
  const { signIn } = useAuthActions()
  const readyFired = useRef(false)
  useEffect(() => {
    if (!auth.isLoading && !restoring) router.invalidate()
  }, [auth.isAuthenticated, auth.isLoading, restoring])
  useEffect(() => {
    if (readyFired.current) return
    if (auth.isLoading || restoring) return
    readyFired.current = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.api?.signalMainReady?.()
        flushPendingDeepLink()
      })
    })
  }, [auth.isLoading, restoring])
  useEffect(() => {
    if (!window.api?.onAuthCode) return
    return window.api.onAuthCode((code) => {
      if (!code) return
      void signIn(undefined as unknown as string, { code }).catch((err) =>
        console.warn('[auth] code exchange failed', err)
      )
    })
  }, [signIn])
  if (auth.isLoading || restoring) return null
  return (
    <LazyMotion features={domAnimation}>
      {auth.isAuthenticated ? <Heartbeat /> : null}
      <TooltipProvider delay={400}>
        <RouterProvider router={router} context={{ queryClient, auth }} />
      </TooltipProvider>
    </LazyMotion>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: CACHE_MAX_AGE,
          buster: CACHE_BUSTER,
          dehydrateOptions: {
            shouldDehydrateQuery: (q) => q.state.status === 'success'
          }
        }}
      >
        <App />
        {import.meta.env.DEV && <Agentation />}
      </PersistQueryClientProvider>
    </ConvexAuthProvider>
  </StrictMode>
)
