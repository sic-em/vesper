import {
  ALL_FORMATS,
  Input,
  UrlSource,
  VideoSampleSink,
  type InputAudioTrack,
  type InputSubtitleTrack,
  type InputVideoTrack
} from 'mediabunny'

export interface VideoMeta {
  displayWidth: number
  displayHeight: number
  codec: string
  codecString: string
  colorTransfer: string
  colorPrimaries: string
  sourceIsHdr: boolean
  canDecode: boolean
  durationSec: number
}

export interface AudioMeta {
  id: string
  codec: string
  lang?: string
  channels: number
  sampleRate: number
  canDecode: boolean
}

export interface PacketStats {
  bitrate: number
  fps: number
}

export interface SubtitleMeta {
  id: string
  codec: string
  lang?: string
  label?: string
}

export interface SubtitleCue {
  start: number
  end: number
  text: string
}

export class Demuxer {
  private input: Input
  private source: UrlSource
  private videoTrack: InputVideoTrack | null = null
  private audioTracks: InputAudioTrack[] = []
  private subtitleTracks: InputSubtitleTrack[] = []
  private _bytesRead = 0

  constructor(url: string) {
    this.source = new UrlSource(url)
    this.source.onread = (start, end) => {
      this._bytesRead += end - start
    }
    this.input = new Input({ source: this.source, formats: ALL_FORMATS })
  }

  get bytesRead(): number {
    return this._bytesRead
  }

  async open(): Promise<VideoMeta> {
    // The debrid CDN can briefly hiccup on the first range requests. Retry a few times
    // before giving up so playback survives a slow first byte.
    let track: Awaited<ReturnType<Input['getPrimaryVideoTrack']>> = null
    let lastErr: unknown
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        track = await this.input.getPrimaryVideoTrack()
        if (track) break
      } catch (e) {
        lastErr = e
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (!track) throw lastErr ?? new Error('no video track in source')
    this.videoTrack = track
    this.audioTracks = await this.input.getAudioTracks()
    this.subtitleTracks = await this.input.getSubtitleTracks().catch(() => [])

    // Duration from container metadata only — fast. The precise scan (computeFullDuration)
    // reads end-of-file packets and is kept off the time-to-first-frame path.
    const [codec, cfg, color, hdr, canDecode, metaDuration] = await Promise.all([
      track.getCodec(),
      track.getDecoderConfig(),
      track.getColorSpace(),
      track.hasHighDynamicRange(),
      track.canDecode(),
      this.input.getDurationFromMetadata().catch(() => null)
    ])

    return {
      displayWidth: track.displayWidth,
      displayHeight: track.displayHeight,
      codec: codec ?? 'unknown',
      codecString: cfg?.codec ?? 'unknown',
      colorTransfer: color.transfer ?? 'unknown',
      colorPrimaries: color.primaries ?? 'unknown',
      sourceIsHdr: hdr,
      canDecode,
      durationSec: metaDuration ?? 0
    }
  }

  async audioMeta(): Promise<AudioMeta[]> {
    return Promise.all(
      this.audioTracks.map(async (t, i) => {
        const lc = await t.getLanguageCode()
        return {
          id: `audio:${i}`,
          codec: (await t.getCodec()) ?? 'unknown',
          lang: lc && lc !== 'und' ? lc : undefined,
          channels: t.numberOfChannels,
          sampleRate: t.sampleRate,
          canDecode: await t.canDecode()
        }
      })
    )
  }

  audioTrackByIndex(i: number): InputAudioTrack | null {
    return this.audioTracks[i] ?? null
  }

  async subtitleMeta(): Promise<SubtitleMeta[]> {
    return Promise.all(
      this.subtitleTracks.map(async (t, i) => {
        const lc = await t.getLanguageCode()
        return {
          id: `sub:${i}`,
          codec: (await t.getCodec()) ?? 'unknown',
          lang: lc && lc !== 'und' ? lc : undefined,
          label: t.name || undefined
        }
      })
    )
  }

  // Streamed, not buffered: reading a subtitle track scans the container's clusters end-to-end,
  // which over a remote file takes tens of seconds. Yielding cues as they're parsed lets the
  // overlay show the early ones immediately (packets arrive in timestamp order).
  async *subtitleCues(index: number, fromSec = 0): AsyncGenerator<SubtitleCue> {
    const t = this.subtitleTracks[index]
    if (!t) return
    const codec = (await t.getCodec()) ?? ''
    for await (const c of t.getCues(fromSec)) {
      const text = cleanCueText(c.text, codec)
      if (text) yield { start: c.timestamp, end: c.timestamp + c.duration, text }
    }
  }

  // Estimated from the first ~`limit` packets — fast, kept off the time-to-first-frame path.
  async videoPacketStats(limit = 100): Promise<PacketStats | null> {
    if (!this.videoTrack) return null
    const s = await this.videoTrack.computePacketStats(limit)
    return { bitrate: s.averageBitrate, fps: s.averagePacketRate }
  }

  async audioPacketStats(index: number, limit = 100): Promise<PacketStats | null> {
    const t = this.audioTracks[index]
    if (!t) return null
    const s = await t.computePacketStats(limit)
    return { bitrate: s.averageBitrate, fps: s.averagePacketRate }
  }

  // Expensive: scans end-of-file packets. Call off the critical path to fill in a duration
  // the container metadata didn't provide.
  computeFullDuration(): Promise<number> {
    return this.input.computeDuration()
  }

  videoSink(): VideoSampleSink {
    if (!this.videoTrack) throw new Error('demuxer not opened')
    return new VideoSampleSink(this.videoTrack)
  }

  dispose(): void {
    this.input.dispose()
  }
}

// ASS/SSA block payloads carry the dialogue fields and inline override codes; strip them to
// plain text. SRT/WebVTT markup is left for the overlay's generic tag stripper.
function cleanCueText(text: string, codec: string): string {
  let t = text
  if (codec === 'ass' || codec === 'ssa') {
    const parts = t.split(',')
    if (parts.length > 8) t = parts.slice(8).join(',')
    t = t.replace(/\{[^}]*\}/g, '')
  }
  return t.replace(/\\N/gi, '\n').replace(/\\h/g, ' ').trim()
}
