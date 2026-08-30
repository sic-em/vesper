import { useEffect } from 'react'
import { router } from '@renderer/router'

const QUEUE_LIMIT = 6
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

export interface PreloadTarget {
  to: string
  params: Record<string, string>
}

export function usePreloadRoute(
  ref: React.RefObject<HTMLElement | null>,
  target: PreloadTarget | null
): void {
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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            trigger()
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    el.addEventListener('pointerenter', trigger)
    el.addEventListener('focus', trigger, true)

    return () => {
      observer.disconnect()
      el.removeEventListener('pointerenter', trigger)
      el.removeEventListener('focus', trigger, true)
    }
  }, [target?.to, target ? JSON.stringify(target.params) : ''])
}
