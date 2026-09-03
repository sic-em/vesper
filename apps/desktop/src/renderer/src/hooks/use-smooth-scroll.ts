import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

// Wheel-driven smooth scrolling for the layout's main scroll pane. Lenis animates the
// pane's real scrollTop, so scroll listeners (virtualizers, IntersectionObservers,
// LoadMore sentinels) keep working unchanged. Pure-horizontal wheel deltas pass through
// to the nested poster rows because the gesture orientation is vertical.
export function useSmoothScroll(
  wrapperRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  enabled: boolean
): React.RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wrapper = wrapperRef.current
    const content = contentRef.current
    if (!wrapper || !content) return

    const lenis = new Lenis({ wrapper, content, lerp: 0.14 })
    lenisRef.current = lenis

    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    })

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [wrapperRef, contentRef, enabled])

  return lenisRef
}
