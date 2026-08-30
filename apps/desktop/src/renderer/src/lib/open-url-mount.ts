import { router } from '../router'

let pendingRoute: string | null = null
let appReady = false

function navigateNow(route: string): void {
  if (!route.startsWith('/')) return
  void router.navigate({ to: route, viewTransition: false } as never)
}

export function mountOpenUrlHandler(): () => void {
  if (typeof window === 'undefined' || !window.api?.onOpenUrl) return () => {}
  return window.api.onOpenUrl((route) => {
    if (!route || !route.startsWith('/')) return
    if (appReady) navigateNow(route)
    else pendingRoute = route
  })
}

export function flushPendingDeepLink(): void {
  appReady = true
  if (pendingRoute) {
    const r = pendingRoute
    pendingRoute = null
    navigateNow(r)
  }
}
