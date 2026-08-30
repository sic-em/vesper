import { registerAc3Decoder } from '@mediabunny/ac3'

let registered = false

// Register WASM decoders WebCodecs lacks natively (AC-3 / E-AC-3). Idempotent.
// Native WebCodecs already covers AAC/Opus/FLAC/MP3. TrueHD/DTS-HD MA are unsupported.
export function ensureExtraDecoders(): void {
  if (registered) return
  registerAc3Decoder()
  registered = true
}
