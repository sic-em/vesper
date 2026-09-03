import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { PlayerController } from '../lib/player/player-controller'
import type { SubtitleCue } from '../lib/player/demuxer'
import type { PlayerError, PlayerStats, PlayerTrack, TimeRange } from '../lib/player/types'

export interface PlayerEngine {
  timePos: number
  duration: number
  paused: boolean
  ended: boolean
  buffering: boolean
  buffered: TimeRange[]
  videoTracks: PlayerTrack[]
  audioTracks: PlayerTrack[]
  subtitleTracks: PlayerTrack[]
  stats: PlayerStats | null
  error: PlayerError | null
  /** The url the state above describes, once it is loaded. Null while a new one is being set up. */
  loadedUrl: string | null
  play(): void
  pause(): void
  togglePause(): void
  seek(sec: number): void
  repaint(): boolean
  setRate(r: number): void
  setVolume(v: number): void
  setMuted(m: boolean): void
  selectAudio(id: string): void
  getSubtitleCueStream(id: string, fromSec?: number): AsyncGenerator<SubtitleCue>
  controllerRef: RefObject<PlayerController | null>
}

async function* noCues(): AsyncGenerator<SubtitleCue> {
  return
}

export function usePlayerEngine(args: {
  url: string | null
  canvasRef: RefObject<HTMLCanvasElement | null>
  startSec?: number
  reloadNonce?: number
}): PlayerEngine {
  const { url, canvasRef, startSec, reloadNonce } = args
  const controllerRef = useRef<PlayerController | null>(null)

  const [timePos, setTimePos] = useState(0)
  const [duration, setDuration] = useState(0)
  const [paused, setPaused] = useState(true)
  const [ended, setEnded] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [buffered, setBuffered] = useState<TimeRange[]>([])
  const [videoTracks, setVideoTracks] = useState<PlayerTrack[]>([])
  const [audioTracks, setAudioTracks] = useState<PlayerTrack[]>([])
  const [subtitleTracks, setSubtitleTracks] = useState<PlayerTrack[]>([])
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [error, setError] = useState<PlayerError | null>(null)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!url || !canvas) return

    // Every reading below belongs to the stream being replaced, and the new controller will not
    // correct them until it has loaded — seconds of network away. Anything reading position or
    // duration in between (progress saving, completion) would be answering about the stream the
    // viewer just left.
    setError(null)
    setEnded(false)
    setLoadedUrl(null)
    setTimePos(startSec ?? 0)
    setDuration(0)
    setBuffered([])
    setStats(null)
    setVideoTracks([])
    setAudioTracks([])
    setSubtitleTracks([])

    let cancelled = false
    const controller = new PlayerController({ url, canvas, startSec })
    controllerRef.current = controller

    const offs = [
      controller.on('timeupdate', setTimePos),
      controller.on('durationchange', setDuration),
      controller.on('buffered', setBuffered),
      controller.on('statechange', (s) => {
        setPaused(s === 'paused' || s === 'idle' || s === 'ended' || s === 'error')
        setEnded(s === 'ended')
        setBuffering(s === 'buffering' || s === 'loading')
      }),
      controller.on('tracks', (t) => {
        setVideoTracks(t.video)
        setAudioTracks(t.audio)
        setSubtitleTracks(t.subtitle)
      }),
      controller.on('stats', setStats),
      controller.on('error', setError)
    ]

    void controller.load().then(() => {
      if (cancelled) return
      setLoadedUrl(url)
      controller.play()
    })

    return () => {
      cancelled = true
      for (const off of offs) off()
      controller.destroy()
      controllerRef.current = null
    }
  }, [url, canvasRef, startSec, reloadNonce])

  const getSubtitleCueStream = useCallback(
    (id: string, fromSec = 0): AsyncGenerator<SubtitleCue> =>
      controllerRef.current?.subtitleCues(id, fromSec) ?? noCues(),
    []
  )

  return {
    timePos,
    duration,
    paused,
    ended,
    buffering,
    buffered,
    videoTracks,
    audioTracks,
    subtitleTracks,
    stats,
    error,
    loadedUrl,
    play: () => controllerRef.current?.play(),
    pause: () => controllerRef.current?.pause(),
    togglePause: () => {
      const c = controllerRef.current
      if (!c) return
      if (c.state === 'playing' || c.state === 'buffering') c.pause()
      else void c.play()
    },
    seek: (sec) => void controllerRef.current?.seek(sec),
    repaint: () => controllerRef.current?.repaint() ?? false,
    setRate: (r) => controllerRef.current?.setRate(r),
    setVolume: (v) => controllerRef.current?.setVolume(v),
    setMuted: (m) => controllerRef.current?.setMuted(m),
    selectAudio: (id) => controllerRef.current?.selectAudioTrack(id),
    getSubtitleCueStream,
    controllerRef
  }
}
