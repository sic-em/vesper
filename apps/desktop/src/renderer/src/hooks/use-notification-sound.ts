import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { useRouterState } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { readNotifSoundEnabled } from '@renderer/lib/notification-prefs'
import soundUrl from '@renderer/assets/sounds/notification-incoming.wav?url'

const VOLUME = 0.5

// Chime once when a genuinely new notification arrives. Seeds on first load (no chime for
// existing rows), ignores reconnects/mark-read (createdAt only advances on a new row), and
// stays quiet while watching. Decodes via Web Audio once so playback has no per-fire latency.
export function useNotificationSound(): void {
  const recent = useQuery(api.notifications.listRecent)
  const onWatch = useRouterState({ select: (s) => s.location.pathname.startsWith('/watch') })
  const lastSeenRef = useRef<number | null>(null)
  const onWatchRef = useRef(onWatch)
  onWatchRef.current = onWatch
  const ctxRef = useRef<AudioContext | null>(null)
  const bufRef = useRef<AudioBuffer | null>(null)

  useEffect(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx
    let cancelled = false
    void (async () => {
      try {
        const arr = await (await fetch(soundUrl)).arrayBuffer()
        const buf = await ctx.decodeAudioData(arr)
        if (!cancelled) bufRef.current = buf
      } catch {
        /* sound is non-critical */
      }
    })()
    return () => {
      cancelled = true
      void ctx.close()
    }
  }, [])

  useEffect(() => {
    if (!recent) return
    const newest = recent[0]?.createdAt ?? 0
    if (lastSeenRef.current === null) {
      lastSeenRef.current = newest
      return
    }
    if (newest <= lastSeenRef.current) return
    lastSeenRef.current = newest
    if (onWatchRef.current) return
    if (!readNotifSoundEnabled()) return
    const ctx = ctxRef.current
    const buf = bufRef.current
    if (!ctx || !buf) return
    if (ctx.state === 'suspended') void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = VOLUME
    src.connect(gain).connect(ctx.destination)
    src.start()
  }, [recent])
}
