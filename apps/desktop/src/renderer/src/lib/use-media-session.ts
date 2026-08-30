import { useEffect } from 'react'

interface MediaSessionArgs {
  title: string
  album?: string | null
  artwork?: string | null
  playing: boolean
  currentTime: number
  duration: number
  playbackRate: number
  togglePlay: () => void
  seek: (time: number) => void
  seekBy: (delta: number) => void
  onPreviousTrack?: (() => void) | null
  onNextTrack?: (() => void) | null
}

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): void {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // unsupported on this platform
  }
}

export function useMediaSession({
  title,
  album,
  artwork,
  playing,
  currentTime,
  duration,
  playbackRate,
  togglePlay,
  seek,
  seekBy,
  onPreviousTrack,
  onNextTrack
}: MediaSessionArgs): void {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Vesper',
      artist: 'Vesper',
      album: album ?? '',
      artwork: artwork
        ? [
            { src: artwork, sizes: '256x256', type: 'image/jpeg' },
            { src: artwork, sizes: '512x512', type: 'image/jpeg' }
          ]
        : []
    })

    safeSetActionHandler('play', () => togglePlay())
    safeSetActionHandler('pause', () => togglePlay())
    safeSetActionHandler('stop', () => togglePlay())
    safeSetActionHandler('seekbackward', (details) => {
      seekBy(-(details.seekOffset ?? 10))
    })
    safeSetActionHandler('seekforward', (details) => {
      seekBy(details.seekOffset ?? 10)
    })
    safeSetActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime)
    })
    safeSetActionHandler('previoustrack', onPreviousTrack ? () => onPreviousTrack() : null)
    safeSetActionHandler('nexttrack', onNextTrack ? () => onNextTrack() : null)

    return () => {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
      safeSetActionHandler('play', null)
      safeSetActionHandler('pause', null)
      safeSetActionHandler('stop', null)
      safeSetActionHandler('seekbackward', null)
      safeSetActionHandler('seekforward', null)
      safeSetActionHandler('seekto', null)
      safeSetActionHandler('previoustrack', null)
      safeSetActionHandler('nexttrack', null)
    }
  }, [title, album, artwork, togglePlay, seek, seekBy, onPreviousTrack, onNextTrack])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    if (!duration || !Number.isFinite(duration)) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(Math.max(0, currentTime), duration),
        playbackRate: playbackRate || 1
      })
    } catch {
      // ignore — invalid state
    }
  }, [currentTime, duration, playbackRate])
}
