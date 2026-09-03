import { useEffect, useRef, useState } from 'react'

export type UseSkeletonSwapOptions = {
  ready: boolean
  delay?: number
  minVisible?: number
}

export function useSkeletonSwap({ ready, delay = 120, minVisible = 380 }: UseSkeletonSwapOptions): {
  showSkeleton: boolean
  busy: boolean
} {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)

  useEffect(() => {
    if (!ready) {
      if (visible) return
      const t = setTimeout(() => {
        shownAt.current = performance.now()
        setVisible(true)
      }, delay)
      return () => clearTimeout(t)
    }

    if (!visible) return
    const rest = Math.max(0, minVisible - (performance.now() - shownAt.current))
    const t = setTimeout(() => setVisible(false), rest)
    return () => clearTimeout(t)
  }, [ready, visible, delay, minVisible])

  return { showSkeleton: visible, busy: !ready }
}
