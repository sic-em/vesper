import { useEffect } from 'react'

/**
 * Keeps the display (and so the machine) awake while `active` is true. Chromium only holds its
 * own wake lock while a <video> element is actually playing, which drops out during buffering
 * and never applies to the canvas-based engine, so the main process holds a blocker for us.
 */
export function useKeepAwake(active: boolean): void {
  useEffect(() => {
    const api = window.api?.power
    if (!api || !active) return
    void api.setPlaybackActive(true)
    return () => {
      void api.setPlaybackActive(false)
    }
  }, [active])
}
