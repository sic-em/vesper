import { AudioSampleSink, type InputAudioTrack } from 'mediabunny'
import type { AvClock } from './av-clock'

const LEAD_SEC = 1.5 // schedule at most this far ahead of the clock
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// Decodes an audio track and schedules PCM buffers onto the clock's AudioContext.
// The GainNode carries volume/mute. Scheduling against clock.ctxTimeFor keeps audio
// locked to the master timeline; video reads the same clock.
export class AudioPipeline {
  private gain: GainNode
  private track: InputAudioTrack
  private clock: AvClock
  private generation = 0
  private activeSources = new Set<AudioBufferSourceNode>()
  private _volume = 1
  private _muted = false

  constructor(clock: AvClock, track: InputAudioTrack) {
    this.clock = clock
    this.track = track
    this.gain = clock.ctx.createGain()
    this.gain.connect(clock.ctx.destination)
  }

  setVolume(v: number): void {
    this._volume = v
    this.gain.gain.value = this._muted ? 0 : v
  }
  setMuted(m: boolean): void {
    this._muted = m
    this.gain.gain.value = m ? 0 : this._volume
  }

  start(fromSec: number): void {
    void this.run(fromSec)
  }

  stop(): void {
    this.generation++
    for (const src of this.activeSources) {
      try {
        src.stop()
        src.disconnect()
      } catch {
        // already stopped
      }
    }
    this.activeSources.clear()
  }

  private async run(fromSec: number): Promise<void> {
    const gen = ++this.generation
    const sink = new AudioSampleSink(this.track)
    const ctx = this.clock.ctx
    let lastScheduledMedia = fromSec

    try {
      for await (const sample of sink.samples(fromSec)) {
        if (gen !== this.generation) {
          sample.close()
          return
        }

        // Backpressure: don't run too far ahead of the clock.
        while (gen === this.generation && lastScheduledMedia - this.clock.now() > LEAD_SEC) {
          await sleep(50)
        }
        if (gen !== this.generation) {
          sample.close()
          return
        }

        const buffer = this.toAudioBuffer(ctx, sample)
        const startTs = sample.timestamp
        lastScheduledMedia = startTs + sample.duration
        sample.close()

        const when = this.clock.ctxTimeFor(startTs)
        // Skip buffers whose presentation time already passed (post-seek catch-up).
        if (when < ctx.currentTime - 0.05) continue

        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.playbackRate.value = this.clock.rate
        src.connect(this.gain)
        src.onended = (): void => {
          this.activeSources.delete(src)
          src.disconnect()
        }
        this.activeSources.add(src)
        src.start(Math.max(when, ctx.currentTime))
      }
    } catch {
      // decode ended or aborted
    }
  }

  private toAudioBuffer(ctx: AudioContext, sample: import('mediabunny').AudioSample): AudioBuffer {
    const channels = sample.numberOfChannels
    const frames = sample.numberOfFrames
    const buffer = ctx.createBuffer(channels, frames, sample.sampleRate)
    for (let ch = 0; ch < channels; ch++) {
      const dest = buffer.getChannelData(ch)
      sample.copyTo(dest, { planeIndex: ch, format: 'f32-planar' })
    }
    return buffer
  }

  destroy(): void {
    this.stop()
    try {
      this.gain.disconnect()
    } catch {
      // noop
    }
  }
}
