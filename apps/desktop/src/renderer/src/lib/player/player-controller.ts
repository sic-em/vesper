import {
  Demuxer,
  type AudioMeta,
  type SubtitleCue,
  type SubtitleMeta,
  type VideoMeta
} from './demuxer'
import { WebGPURenderer } from './webgpu-renderer'
import { AvClock } from './av-clock'
import { AudioPipeline } from './audio-pipeline'
import { ensureExtraDecoders } from './codec-support'
import {
  ANIME4K_DEFAULT_PRESET,
  capPreset,
  sameAnime4kStatus,
  stepDownPreset,
  type Anime4kPref,
  type Anime4kPreset,
  type Anime4kStatus
} from './anime4k'
import type { PlayerEvents, PlayerState, PlayerStats, PlayerTrack } from './types'

const LATE_DROP_MS = 50
const STAT_INTERVAL_MS = 500
const STALL_MS = 250

// Step-down policy: judge over a 2s window of stat ticks, after a 4s grace period for a fresh
// chain to warm up, and only when drops are both frequent and numerous — network stalls pause
// the loop without dropping, so sustained drops mean decode/render can't keep pace.
const ANIME4K_WINDOW_TICKS = 4
const ANIME4K_GRACE_MS = 4000
const ANIME4K_MIN_DROPS = 10
const ANIME4K_DROP_RATIO = 0.15
// Below this on-screen magnification an upscale adds nothing visible — same threshold the
// upstream Mode A chain uses before it bothers upscaling.
const ANIME4K_MIN_SCALE = 1.2

type Handlers = { [K in keyof PlayerEvents]: Set<PlayerEvents[K]> }

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

export class PlayerController {
  private demuxer: Demuxer
  private renderer = new WebGPURenderer()
  private clock = new AvClock()
  private audio: AudioPipeline | null = null
  private audioMeta: AudioMeta[] = []
  private subtitleMeta: SubtitleMeta[] = []
  private selectedAudio = -1
  private canvas: HTMLCanvasElement
  private meta: VideoMeta | null = null
  // Kept so the current picture can be redrawn on demand — see repaint().
  private lastFrame: VideoFrame | null = null

  private handlers: Handlers = {
    timeupdate: new Set(),
    durationchange: new Set(),
    buffered: new Set(),
    statechange: new Set(),
    tracks: new Set(),
    stats: new Set(),
    error: new Set(),
    anime4k: new Set()
  }

  private anime4kPref: Anime4kPref = { enabled: false, preset: ANIME4K_DEFAULT_PRESET }
  /** Session step-down ceiling — never persisted, retried fresh next playback. */
  private anime4kCeiling: Anime4kPreset | 'off' | null = null
  private anime4kStatus: Anime4kStatus = { kind: 'off' }
  private anime4kChangedAt = 0
  private a4kWindow: { dropped: number; displayed: number }[] = []
  private a4kPrevDropped = 0
  private a4kPrevDisplayed = 0
  private readonly onWindowResize = (): void => this.evaluateAnime4k()

  private _state: PlayerState = 'idle'
  private _mediaTime = 0
  private _duration = 0
  private _volume = 1
  private _muted = false

  private generation = 0
  private paused = true
  private resumeDeferred: { promise: Promise<void>; resolve: () => void } | null = null

  private displayedFrames = 0
  private droppedFrames = 0
  private lastFps = 0
  private rebuffers = 0

  private loadStartedAt = 0
  private ttffMs: number | null = null
  private videoBitrate: number | null = null
  private audioBitrate: number | null = null

  private lastBytes = 0
  private lastBytesAt = 0
  private throughputBps = 0

  constructor(opts: { url: string; canvas: HTMLCanvasElement; startSec?: number }) {
    this.demuxer = new Demuxer(opts.url)
    this.canvas = opts.canvas
    this._mediaTime = opts.startSec ?? 0
    // The resolution bypass compares source size against the displayed size, which changes with
    // the window (fullscreen, snapping) — re-evaluate on resize.
    window.addEventListener('resize', this.onWindowResize)
    this.renderer.onAnime4kError = (): void => {
      this.anime4kCeiling = 'off'
      this.applyAnime4k({ kind: 'suspended' }, 'off')
    }
    this.renderer.onAnime4kReady = (): void => {
      if (this.paused) this.repaint()
    }
  }

  on<K extends keyof PlayerEvents>(event: K, cb: PlayerEvents[K]): () => void {
    this.handlers[event].add(cb)
    return () => this.handlers[event].delete(cb)
  }

  private emit<K extends keyof PlayerEvents>(event: K, ...args: Parameters<PlayerEvents[K]>): void {
    for (const cb of this.handlers[event]) (cb as (...a: unknown[]) => void)(...args)
  }

  private setState(s: PlayerState): void {
    if (this._state === s) return
    this._state = s
    this.emit('statechange', s)
  }

  get state(): PlayerState {
    return this._state
  }
  get currentTime(): number {
    return this._mediaTime
  }
  get duration(): number {
    return this._duration
  }
  get canvasFrameSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height }
  }
  get stats(): PlayerStats {
    return this.buildStats()
  }

  async load(): Promise<void> {
    this.setState('loading')
    this.loadStartedAt = performance.now()
    try {
      ensureExtraDecoders()
      const meta = await this.demuxer.open()
      this.meta = meta
      this.canvas.width = meta.displayWidth
      this.canvas.height = meta.displayHeight
      await this.renderer.init(this.canvas)
      this._duration = meta.durationSec
      this.emit('durationchange', meta.durationSec)

      this.audioMeta = await this.demuxer.audioMeta()
      const audioTracks: PlayerTrack[] = this.audioMeta.map((a) => ({
        id: a.id,
        kind: 'audio',
        codec: a.codec,
        lang: a.lang,
        channels: a.channels,
        decodable: a.canDecode
      }))
      this.subtitleMeta = await this.demuxer.subtitleMeta()
      const subtitleTracks: PlayerTrack[] = this.subtitleMeta.map((s) => ({
        id: s.id,
        kind: 'subtitle',
        codec: s.codec,
        lang: s.lang,
        label: s.label,
        decodable: true
      }))
      this.emit('tracks', {
        video: [
          {
            id: 'video:0',
            kind: 'video',
            codec: meta.codec,
            isDefault: true,
            decodable: meta.canDecode
          }
        ],
        audio: audioTracks,
        subtitle: subtitleTracks
      })

      if (!meta.canDecode) {
        this.fail('video-undecodable', `codec ${meta.codecString} cannot be decoded`, false)
        return
      }

      const firstDecodable = this.audioMeta.findIndex((a) => a.canDecode)
      if (firstDecodable >= 0) this.attachAudio(firstDecodable)

      this.evaluateAnime4k()

      void this.computeBitrates()

      this.setState('paused')
      this.emit('stats', this.buildStats())
    } catch (e) {
      this.fail('load-failed', errMsg(e), false)
    }
  }

  private attachAudio(index: number): void {
    this.audio?.destroy()
    const track = this.demuxer.audioTrackByIndex(index)
    if (!track) {
      this.audio = null
      this.selectedAudio = -1
      return
    }
    this.audio = new AudioPipeline(this.clock, track)
    this.audio.setVolume(this._volume)
    this.audio.setMuted(this._muted)
    this.selectedAudio = index
  }

  async play(): Promise<void> {
    if (this._state === 'error' || this._state === 'ended') return
    if (!this.paused) return
    this.paused = false
    await this.clock.start(this._mediaTime)
    this.setState('playing')
    if (this.resumeDeferred) {
      this.resumeDeferred.resolve()
      this.resumeDeferred = null
    } else {
      this.audio?.start(this._mediaTime)
      void this.runVideoLoop(this._mediaTime)
    }
  }

  async pause(): Promise<void> {
    if (this.paused) return
    this.paused = true
    this._mediaTime = this.clock.now()
    await this.clock.pause()
    this.resumeDeferred = this.makeDeferred()
    this.setState('paused')
  }

  async seek(sec: number): Promise<void> {
    const target = Math.max(0, Math.min(sec, this._duration || sec))
    this._mediaTime = target
    this.generation++
    this.audio?.stop()
    this.emit('timeupdate', target)
    const wasPlaying = !this.paused
    if (this.resumeDeferred) {
      this.resumeDeferred.resolve()
      this.resumeDeferred = null
    }
    this.clock.reanchor(target)
    if (wasPlaying) {
      this.setState('buffering')
      this.audio?.start(target)
      void this.runVideoLoop(target)
    }
  }

  /**
   * Redraws the frame that is already on screen.
   *
   * Canvas capture (what picture-in-picture mirrors) only samples the canvas when something draws
   * to it, and a paused player draws nothing — so PiP needs a way to ask for the current picture.
   * Returns false when no frame has been rendered yet.
   */
  repaint(): boolean {
    if (!this.lastFrame) return false
    this.renderer.render(this.lastFrame)
    return true
  }

  private retainFrame(frame: VideoFrame): void {
    this.lastFrame?.close()
    this.lastFrame = frame
  }

  setRate(rate: number): void {
    this.clock.setRate(rate)
  }

  setAnime4k(pref: Anime4kPref): void {
    this.anime4kPref = pref
    // An explicit user choice resets any session step-down — their call beats the ladder.
    this.anime4kCeiling = null
    this.evaluateAnime4k()
  }

  private evaluateAnime4k(): void {
    this.applyAnime4k(this.computeAnime4kStatus(), null)
  }

  private computeAnime4kStatus(): Anime4kStatus {
    const m = this.meta
    if (!m || !this.anime4kPref.enabled) return { kind: 'off' }
    if (m.sourceIsHdr) return { kind: 'bypassed', reason: 'hdr' }
    if (!this.anime4kUpscaleVisible(m.displayWidth, m.displayHeight)) {
      return { kind: 'bypassed', reason: 'resolution' }
    }
    if (this.anime4kCeiling === 'off') return { kind: 'suspended' }
    const preset = this.anime4kCeiling
      ? capPreset(this.anime4kPref.preset, this.anime4kCeiling)
      : this.anime4kPref.preset
    return { kind: 'active', preset }
  }

  private anime4kUpscaleVisible(srcW: number, srcH: number): boolean {
    const dpr = window.devicePixelRatio || 1
    const cw = this.canvas.clientWidth * dpr
    const ch = this.canvas.clientHeight * dpr
    if (cw <= 0 || ch <= 0) return true
    // The canvas is object-contain over the viewport; this is the on-screen magnification.
    const scale = Math.min(cw / srcW, ch / srcH)
    return scale > ANIME4K_MIN_SCALE
  }

  private applyAnime4k(status: Anime4kStatus, droppedTo: Anime4kPreset | 'off' | null): void {
    if (sameAnime4kStatus(this.anime4kStatus, status) && droppedTo == null) return
    this.anime4kStatus = status
    this.anime4kChangedAt = performance.now()
    this.a4kWindow = []
    const m = this.meta
    if (m) {
      const active = status.kind === 'active'
      this.renderer.setAnime4k(active ? status.preset : null)
      // The chain doubles the source, so the canvas backing store must too — otherwise the
      // upscaled texture would be squeezed right back down before it reaches the screen.
      const w = active ? m.displayWidth * 2 : m.displayWidth
      const h = active ? m.displayHeight * 2 : m.displayHeight
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w
        this.canvas.height = h
      }
      if (this.paused) this.repaint()
    }
    this.emit('anime4k', { status, droppedTo })
    this.emit('stats', this.buildStats())
  }

  private monitorAnime4kLoad(now: number): void {
    const droppedDelta = this.droppedFrames - this.a4kPrevDropped
    const displayedDelta = this.displayedFrames - this.a4kPrevDisplayed
    this.a4kPrevDropped = this.droppedFrames
    this.a4kPrevDisplayed = this.displayedFrames
    if (this.anime4kStatus.kind !== 'active') return
    if (now - this.anime4kChangedAt < ANIME4K_GRACE_MS) return
    this.a4kWindow.push({ dropped: droppedDelta, displayed: displayedDelta })
    if (this.a4kWindow.length > ANIME4K_WINDOW_TICKS) this.a4kWindow.shift()
    if (this.a4kWindow.length < ANIME4K_WINDOW_TICKS) return
    let dropped = 0
    let displayed = 0
    for (const t of this.a4kWindow) {
      dropped += t.dropped
      displayed += t.displayed
    }
    const total = dropped + displayed
    if (total === 0 || dropped < ANIME4K_MIN_DROPS || dropped / total < ANIME4K_DROP_RATIO) return
    const next = stepDownPreset(this.anime4kStatus.preset)
    this.anime4kCeiling = next ?? 'off'
    this.applyAnime4k(
      next ? { kind: 'active', preset: next } : { kind: 'suspended' },
      next ?? 'off'
    )
  }

  setVolume(v: number): void {
    this._volume = v
    this.audio?.setVolume(v)
  }

  setMuted(m: boolean): void {
    this._muted = m
    this.audio?.setMuted(m)
  }

  selectAudioTrack(id: string): void {
    const index = this.audioMeta.findIndex((a) => a.id === id)
    if (index < 0 || index === this.selectedAudio) return
    this.attachAudio(index)
    void this.computeAudioBitrate()
    if (!this.paused) this.audio?.start(this.clock.now())
  }

  subtitleCues(id: string, fromSec = 0): AsyncGenerator<SubtitleCue> {
    const index = this.subtitleMeta.findIndex((s) => s.id === id)
    if (index < 0) return emptyCues()
    return this.demuxer.subtitleCues(index, fromSec)
  }

  private makeDeferred(): { promise: Promise<void>; resolve: () => void } {
    let resolve!: () => void
    const promise = new Promise<void>((r) => (resolve = r))
    return { promise, resolve }
  }

  private async runVideoLoop(fromSec: number): Promise<void> {
    const gen = ++this.generation
    const sink = this.demuxer.videoSink()
    const ctx = this.clock.ctx
    const iter = sink.samples(fromSec)[Symbol.asyncIterator]()
    let lastStat = performance.now()
    let framesSinceStat = 0

    try {
      for (;;) {
        // A next() that overruns STALL_MS mid-playback is an unplanned rebuffer (slow CDN).
        let stallTimer: ReturnType<typeof setTimeout> | null = null
        if (this.displayedFrames > 0 && !this.paused && this._state === 'playing') {
          stallTimer = setTimeout(() => {
            if (gen !== this.generation || this.paused) return
            this.rebuffers++
            this.setState('buffering')
          }, STALL_MS)
        }
        const res = await iter.next()
        if (stallTimer) clearTimeout(stallTimer)

        if (gen !== this.generation) {
          res.value?.close()
          return
        }
        if (res.done) break
        const sample = res.value

        if (this.paused && this.resumeDeferred) {
          await this.resumeDeferred.promise
          if (gen !== this.generation) {
            sample.close()
            return
          }
        }

        const sampleSec = sample.timestamp
        // Wall delay until this frame's presentation time on the master clock.
        const delayMs = (this.clock.ctxTimeFor(sampleSec) - ctx.currentTime) * 1000
        if (delayMs > 1) await sleep(delayMs)
        else if (delayMs < -LATE_DROP_MS) {
          this.droppedFrames++
          sample.close()
          continue
        }
        if (gen !== this.generation) {
          sample.close()
          return
        }

        const frame = sample.toVideoFrame()
        this.renderer.render(frame)
        this.retainFrame(frame)
        sample.close()

        if (this.ttffMs == null) this.ttffMs = performance.now() - this.loadStartedAt

        this._mediaTime = sampleSec
        this.displayedFrames++
        framesSinceStat++
        if (this._state === 'buffering') this.setState('playing')

        const now = performance.now()
        if (now - lastStat >= STAT_INTERVAL_MS) {
          this.lastFps = (framesSinceStat * 1000) / (now - lastStat)
          framesSinceStat = 0
          this.sampleThroughput(now)
          this.monitorAnime4kLoad(now)
          lastStat = now
          this.emit('timeupdate', this._mediaTime)
          this.emit('stats', this.buildStats())
        }
      }
      if (gen === this.generation) {
        this.setState('ended')
        this.emit('timeupdate', this._duration)
      }
    } catch (e) {
      if (gen === this.generation) this.fail('decode-failed', errMsg(e), true)
    } finally {
      // Manual iteration skips the auto-cleanup `for await` does on early exit; without this
      // the sink generator's buffered VideoSample is GC'd unclosed (warning on every seek).
      await iter.return?.()
    }
  }

  private sampleThroughput(now: number): void {
    const bytes = this.demuxer.bytesRead
    if (this.lastBytesAt > 0) {
      const dt = (now - this.lastBytesAt) / 1000
      if (dt > 0) this.throughputBps = ((bytes - this.lastBytes) * 8) / dt
    }
    this.lastBytes = bytes
    this.lastBytesAt = now
  }

  private async computeBitrates(): Promise<void> {
    try {
      const v = await this.demuxer.videoPacketStats()
      this.videoBitrate = v?.bitrate ?? null
    } catch {
      this.videoBitrate = null
    }
    await this.computeAudioBitrate()
    this.emit('stats', this.buildStats())
  }

  private async computeAudioBitrate(): Promise<void> {
    if (this.selectedAudio < 0) {
      this.audioBitrate = null
      return
    }
    try {
      const a = await this.demuxer.audioPacketStats(this.selectedAudio)
      this.audioBitrate = a?.bitrate ?? null
    } catch {
      this.audioBitrate = null
    }
  }

  private buildStats(): PlayerStats {
    const m = this.meta
    const a = this.selectedAudio >= 0 ? this.audioMeta[this.selectedAudio] : undefined
    return {
      resolution: m ? `${m.displayWidth}×${m.displayHeight}` : '—',
      renderResolution: `${this.canvas.width}×${this.canvas.height}`,
      videoCodec: m ? videoCodecLabel(m.codec, m.codecString) : 'unknown',
      colorTransfer: m?.colorTransfer ?? 'unknown',
      colorPrimaries: m?.colorPrimaries ?? 'unknown',
      sourceIsHdr: m?.sourceIsHdr ?? false,
      videoBitrate: this.videoBitrate,
      displayedFrames: this.displayedFrames,
      droppedFrames: this.droppedFrames,
      fps: Math.round(this.lastFps * 10) / 10,
      decodeHw: null,
      anime4k: this.anime4kStatus,

      audioCodec: a?.codec ?? null,
      audioChannels: a?.channels ?? null,
      audioSampleRate: a?.sampleRate ?? null,
      audioLang: a?.lang ?? null,
      audioBitrate: this.audioBitrate,

      positionSec: this._mediaTime,
      durationSec: this._duration,
      timeToFirstFrameMs: this.ttffMs,

      bytesDownloaded: this.demuxer.bytesRead,
      throughputBps: this.throughputBps,

      rebuffers: this.rebuffers
    }
  }

  private fail(code: string, message: string, recoverable: boolean): void {
    this.setState('error')
    this.emit('error', { code, message, recoverable })
  }

  destroy(): void {
    this.generation++
    window.removeEventListener('resize', this.onWindowResize)
    if (this.resumeDeferred) this.resumeDeferred.resolve()
    this.audio?.destroy()
    this.lastFrame?.close()
    this.lastFrame = null
    this.renderer.destroy()
    this.demuxer.dispose()
    void this.clock.close()
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e)
}

async function* emptyCues(): AsyncGenerator<SubtitleCue> {
  return
}

function videoCodecLabel(codec: string, codecString: string): string {
  if (!codecString || codecString === 'unknown' || codecString === codec) return codec
  return `${codec} (${codecString})`
}
