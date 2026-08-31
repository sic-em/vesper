import { useEffect, useState } from 'react'
import type Hls from 'hls.js'

export interface AudioTrack {
  id: string
  lang: string
  label: string
  kind?: string
  channels?: string
  codec?: string
  isDefault: boolean
  source: 'video' | 'hls'
  index: number
  /** WebCodecs cannot decode every codec a container carries; an undecodable track is silence. */
  decodable: boolean
}

interface NativeAudioTrack {
  id?: string
  language?: string
  label?: string
  kind?: string
  enabled?: boolean
}

interface NativeAudioTrackList {
  length: number
  [i: number]: NativeAudioTrack
  addEventListener?: (e: string, cb: () => void) => void
  removeEventListener?: (e: string, cb: () => void) => void
}

export function useAudioTracks(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  hlsRef: React.RefObject<Hls | null>
): { tracks: AudioTrack[]; selectedIndex: number; setSelected: (id: string) => void } {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const refresh = (): void => {
      const collected = collect(video, hlsRef.current)
      setTracks(collected)
      setSelectedIndex(currentIndex(collected, video, hlsRef.current))
    }
    refresh()

    const at = (video as unknown as { audioTracks?: NativeAudioTrackList }).audioTracks
    at?.addEventListener?.('addtrack', refresh)
    at?.addEventListener?.('removetrack', refresh)
    at?.addEventListener?.('change', refresh)

    const hls = hlsRef.current
    const HLS_EVENTS = ['hlsAudioTracksUpdated', 'hlsAudioTrackSwitched']
    HLS_EVENTS.forEach((e) => hls?.on(e as Parameters<typeof hls.on>[0], refresh))

    const iv = window.setInterval(refresh, 1000)
    return () => {
      at?.removeEventListener?.('addtrack', refresh)
      at?.removeEventListener?.('removetrack', refresh)
      at?.removeEventListener?.('change', refresh)
      HLS_EVENTS.forEach((e) => hls?.off(e as Parameters<typeof hls.off>[0], refresh))
      window.clearInterval(iv)
    }
  }, [videoRef, hlsRef])

  const setSelected = (id: string): void => {
    const video = videoRef.current
    const hls = hlsRef.current
    if (!video) return
    const t = tracks.find((x) => x.id === id)
    if (!t) return
    if (t.source === 'hls' && hls) {
      hls.audioTrack = t.index
    } else {
      const at = (video as unknown as { audioTracks?: NativeAudioTrackList }).audioTracks
      if (at) {
        for (let i = 0; i < at.length; i++) {
          ;(at[i] as NativeAudioTrack).enabled = i === t.index
        }
      }
    }
    setSelectedIndex(tracks.findIndex((x) => x.id === id))
  }

  return { tracks, selectedIndex, setSelected }
}

function collect(video: HTMLVideoElement, hls: Hls | null): AudioTrack[] {
  const out: AudioTrack[] = []
  if (hls && hls.audioTracks.length > 0) {
    hls.audioTracks.forEach((t, i) => {
      const attrs = (t as unknown as { attrs?: Record<string, string> }).attrs ?? {}
      out.push({
        id: `hls:${i}`,
        lang: (t.lang || 'unknown').toLowerCase(),
        label: t.name || t.lang || `Track ${i + 1}`,
        kind: attrs.CHARACTERISTICS?.toLowerCase().includes('description')
          ? 'description'
          : attrs.CHARACTERISTICS?.toLowerCase().includes('commentary')
            ? 'commentary'
            : undefined,
        channels: attrs.CHANNELS,
        codec: (t as unknown as { audioCodec?: string }).audioCodec,
        isDefault: !!t.default,
        decodable: true,
        source: 'hls',
        index: i
      })
    })
    return out
  }
  const at = (video as unknown as { audioTracks?: NativeAudioTrackList }).audioTracks
  if (at) {
    for (let i = 0; i < at.length; i++) {
      const t = at[i] as NativeAudioTrack
      out.push({
        id: `video:${i}`,
        lang: (t.language || 'unknown').toLowerCase(),
        label: t.label || t.language || `Track ${i + 1}`,
        kind: t.kind,
        isDefault: !!t.enabled,
        decodable: true,
        source: 'video',
        index: i
      })
    }
  }
  return out
}

function currentIndex(tracks: AudioTrack[], video: HTMLVideoElement, hls: Hls | null): number {
  if (hls && hls.audioTracks.length > 0) {
    return tracks.findIndex((t) => t.source === 'hls' && t.index === hls.audioTrack)
  }
  const at = (video as unknown as { audioTracks?: NativeAudioTrackList }).audioTracks
  if (at) {
    for (let i = 0; i < at.length; i++) {
      if ((at[i] as NativeAudioTrack).enabled) {
        return tracks.findIndex((t) => t.source === 'video' && t.index === i)
      }
    }
  }
  return -1
}
