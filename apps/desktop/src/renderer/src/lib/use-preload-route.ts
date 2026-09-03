import { useEffect } from 'react'
import { router } from '@renderer/router'

const QUEUE_LIMIT = 6
const VIEWPORT_MARGIN = '200px'
let inFlight = 0
const pending: Array<() => Promise<void>> = []
const seen = new Set<string>()

function drain(): void {
  while (inFlight < QUEUE_LIMIT && pending.length > 0) {
    const task = pending.shift()!
    inFlight++
    void task().finally(() => {
      inFlight--
      drain()
    })
  }
}

function enqueue(task: () => Promise<void>): void {
  pending.push(task)
  drain()
}

// One IntersectionObserver for every preloadable card. A per-card observer (hundreds on the home
// page) made Blink recompute hundreds of intersections on every scrolled frame.
const viewportTriggers = new WeakMap<Element, () => void>()
let viewportObserver: IntersectionObserver | null = null

function observeViewport(el: Element, trigger: () => void): () => void {
  if (!viewportObserver) {
    viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const fire = viewportTriggers.get(entry.target)
          viewportTriggers.delete(entry.target)
          viewportObserver?.unobserve(entry.target)
          fire?.()
        }
      },
      { rootMargin: VIEWPORT_MARGIN }
    )
  }
  viewportTriggers.set(el, trigger)
  viewportObserver.observe(el)
  return () => {
    viewportTriggers.delete(el)
    viewportObserver?.unobserve(el)
  }
}

// Viewport-driven preloads are speculative, so keep them off the frames that are busy scrolling.
function whenIdle(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: 1000 })
  } else {
    setTimeout(fn, 150)
  }
}

export interface PreloadTarget {
  to: string
  params: Record<string, string>
}

export function usePreloadRoute(
  ref: React.RefObject<HTMLElement | null>,
  target: PreloadTarget | null,
  // Viewport preloading suits short bounded rows. On endless grids it turns scrolling into a
  // preload firehose (detail loaders fetch full-size art), so those pass viewport: false and
  // keep only the hover/focus intent triggers.
  opts?: { viewport?: boolean }
): void {
  const viewport = opts?.viewport ?? true
  useEffect(() => {
    if (!target) return
    const el = ref.current
    if (!el) return
    const key = `${target.to}:${JSON.stringify(target.params)}`
    if (seen.has(key)) return

    const trigger = (): void => {
      if (seen.has(key)) return
      seen.add(key)
      enqueue(async () => {
        try {
          await router.preloadRoute({
            to: target.to as never,
            params: target.params as never
          })
        } catch {
          /* preload failures are non-fatal */
        }
      })
    }

    const unobserve = viewport ? observeViewport(el, () => whenIdle(trigger)) : undefined
    el.addEventListener('pointerenter', trigger)
    el.addEventListener('focus', trigger, true)

    return () => {
      unobserve?.()
      el.removeEventListener('pointerenter', trigger)
      el.removeEventListener('focus', trigger, true)
    }
  }, [target?.to, target ? JSON.stringify(target.params) : '', viewport])
}
