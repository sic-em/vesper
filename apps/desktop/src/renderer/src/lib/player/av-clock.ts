// Master clock backed by an AudioContext. ctx.currentTime advances in real time
// whether or not audio buffers are scheduled, so this is the single timeline for
// both audio scheduling and video frame presentation (audio-master per ADR-0007).
// Pause freezes time via ctx.suspend(); the audio pipeline schedules into the same ctx.
export class AvClock {
  readonly ctx: AudioContext

  private anchorCtx = 0
  private anchorMedia = 0
  private _rate = 1
  private running = false

  constructor() {
    this.ctx = new AudioContext()
    void this.ctx.suspend()
  }

  get rate(): number {
    return this._rate
  }

  // Current media position in seconds.
  now(): number {
    if (!this.running) return this.anchorMedia
    return this.anchorMedia + (this.ctx.currentTime - this.anchorCtx) * this._rate
  }

  // ctx time at which a given media timestamp should be presented.
  ctxTimeFor(mediaSec: number): number {
    return this.anchorCtx + (mediaSec - this.anchorMedia) / this._rate
  }

  async start(mediaSec: number): Promise<void> {
    await this.ctx.resume()
    this.anchorMedia = mediaSec
    this.anchorCtx = this.ctx.currentTime
    this.running = true
  }

  async pause(): Promise<void> {
    this.anchorMedia = this.now()
    this.running = false
    await this.ctx.suspend()
  }

  // Re-anchor to a new media position (seek) while keeping running state.
  reanchor(mediaSec: number): void {
    this.anchorMedia = mediaSec
    this.anchorCtx = this.ctx.currentTime
  }

  setRate(rate: number): void {
    this.anchorMedia = this.now()
    this.anchorCtx = this.ctx.currentTime
    this._rate = rate
  }

  async close(): Promise<void> {
    try {
      await this.ctx.close()
    } catch {
      // already closed
    }
  }
}
