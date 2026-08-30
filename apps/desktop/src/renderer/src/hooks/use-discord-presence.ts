import { useEffect, useRef, useState } from 'react'
import { readDiscordRpcEnabled } from '@renderer/lib/discord-prefs'

const HEARTBEAT_MS = 15_000

interface Params {
  title: string
  poster?: string | null
  season?: number | null
  episode?: number | null
  epTitle?: string | null
  currentTime: number
  duration: number
  playing: boolean
}

function stripEpisodeSuffix(title: string): string {
  return title
    .replace(/\s*[·•\-–—|]\s*S\d{1,2}[EeXx]\d{1,3}.*$/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function useDiscordPresence({
  title,
  poster,
  season,
  episode,
  epTitle,
  currentTime,
  duration,
  playing
}: Params): void {
  const [enabled, setEnabled] = useState<boolean>(() => readDiscordRpcEnabled())

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === 'vesper.playback.discordRpc') setEnabled(readDiscordRpcEnabled())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const details = stripEpisodeSuffix(title)
  const state =
    season && episode
      ? epTitle
        ? `S${pad2(season)}E${pad2(episode)} – ${epTitle}`
        : `S${pad2(season)}E${pad2(episode)}`
      : 'Watching'
  const largeText = details

  const push = useRef<{
    lastUpdateMs: number
    lastState: 'playing' | 'paused' | 'cleared'
    sessionStartSec: number | null
  }>({ lastUpdateMs: 0, lastState: 'cleared', sessionStartSec: null })

  useEffect(() => {
    const api = window.api?.discord
    if (!api) return
    if (!enabled) {
      if (push.current.lastState !== 'cleared') {
        void api.clearActivity?.()
        push.current.lastState = 'cleared'
      }
      return
    }
    if (!details) return

    const hasPosition = Number.isFinite(duration) && duration > 0
    const nowSec = Math.floor(Date.now() / 1000)

    const sendPlaying = (): void => {
      const pos = Math.max(0, Math.floor(currentTime))
      const remaining = hasPosition ? Math.max(0, Math.floor(duration - currentTime)) : 0
      if (push.current.sessionStartSec === null) {
        push.current.sessionStartSec = nowSec
      }
      void api.setActivity({
        details,
        state,
        largeImage: poster || 'vespr',
        largeText,
        startTimestamp: nowSec - pos,
        endTimestamp: hasPosition ? nowSec + remaining : undefined
      })
      push.current.lastUpdateMs = Date.now()
      push.current.lastState = 'playing'
    }

    const sendPaused = (): void => {
      void api.setActivity({
        details,
        state: 'Paused',
        largeImage: poster || 'vespr',
        largeText
      })
      push.current.lastUpdateMs = Date.now()
      push.current.lastState = 'paused'
    }

    if (playing) {
      if (push.current.lastState !== 'playing') {
        sendPlaying()
        return
      }
      if (Date.now() - push.current.lastUpdateMs >= HEARTBEAT_MS) {
        sendPlaying()
      }
    } else {
      if (push.current.lastState !== 'paused') sendPaused()
    }
  }, [enabled, playing, currentTime, duration, details, state, largeText, poster])

  useEffect(() => {
    return () => {
      void window.api?.discord?.clearActivity?.()
      push.current.lastState = 'cleared'
      push.current.sessionStartSec = null
    }
  }, [])
}
