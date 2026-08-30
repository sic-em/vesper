import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'

const STATE_INDEX_KEY = '__TSR_index'

export interface NavState {
  canGoBack: boolean
  canGoForward: boolean
  back: () => void
  forward: () => void
}

export function useNavState(): NavState {
  const router = useRouter()
  const [, force] = useState(0)
  useEffect(() => {
    return router.history.subscribe(() => force((n) => n + 1))
  }, [router])

  const state = router.history.location.state as unknown as Record<string, unknown> | undefined
  const idx = (state?.[STATE_INDEX_KEY] as number | undefined) ?? 0
  const len = router.history.length
  return {
    canGoBack: idx > 0,
    canGoForward: idx < len - 1,
    back: () => router.history.back(),
    forward: () => router.history.forward()
  }
}
