export type PlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error'

export interface PlayerTrack {
  id: string
  kind: 'video' | 'audio' | 'subtitle'
  lang?: string
  label?: string
  codec?: string
  channels?: number
  isDefault?: boolean
  decodable: boolean
}

export interface PlayerStats {
  resolution: string
  renderResolution: string
  videoCodec: string
  colorTransfer: string
  colorPrimaries: string
  sourceIsHdr: boolean
  videoBitrate: number | null
  displayedFrames: number
  droppedFrames: number
  fps: number
  decodeHw: boolean | null

  audioCodec: string | null
  audioChannels: number | null
  audioSampleRate: number | null
  audioLang: string | null
  audioBitrate: number | null

  positionSec: number
  durationSec: number
  timeToFirstFrameMs: number | null

  bytesDownloaded: number
  throughputBps: number

  rebuffers: number
}

export interface TimeRange {
  start: number
  end: number
}

export interface PlayerError {
  code: string
  message: string
  recoverable: boolean
}

export interface PlayerEvents {
  timeupdate: (sec: number) => void
  durationchange: (sec: number) => void
  buffered: (ranges: TimeRange[]) => void
  statechange: (s: PlayerState) => void
  tracks: (t: { video: PlayerTrack[]; audio: PlayerTrack[]; subtitle: PlayerTrack[] }) => void
  stats: (s: PlayerStats) => void
  error: (e: PlayerError) => void
}
