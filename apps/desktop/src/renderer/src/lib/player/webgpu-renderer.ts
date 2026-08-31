/// <reference types="@webgpu/types" />

// Full-screen triangle sampling a WebCodecs VideoFrame as an external texture.
//
// HDR10 is the hard case. WebGPU has no rec2100-pq color space, so there is no way to tell
// importExternalTexture what a PQ frame actually is, and no way to control what it does with it.
// What Chromium hands the shader is therefore not reliably documented, and the symptom on screen
// (milky blacks, no saturation) does not distinguish between the possibilities:
//
//   - it converted correctly and the headroom above 1.0 is being clipped, or
//   - it never applied the PQ EOTF, so we are looking at raw PQ code values as if they were sRGB,
//     which lifts blacks and compresses highlights, or
//   - it converted the transfer function but left BT.2020 primaries alone, which desaturates.
//
// Each needs a different correction, and applying the wrong one makes the picture worse. So the
// shader implements all of them behind ToneMode and the player can cycle modes at runtime — the
// one that looks right identifies which of the above is actually happening.
const WGSL = /* wgsl */ `
struct Params {
  mode: f32,
  knee: f32,
  _pad0: f32,
  _pad1: f32,
};

@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var tex: texture_external;
@group(0) @binding(2) var<uniform> params: Params;

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2f,3>(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0));
  var uv = array<vec2f,3>(vec2f(0.0,1.0), vec2f(2.0,1.0), vec2f(0.0,-1.0));
  var o: VOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = uv[i];
  return o;
}

// Sign-preserving so out-of-gamut negatives survive the round trip instead of folding to zero.
fn srgbToLinear(c: f32) -> f32 {
  let a = abs(c);
  let l = select(a / 12.92, pow((a + 0.055) / 1.055, 2.4), a > 0.04045);
  return select(-l, l, c >= 0.0);
}

fn linearToSrgb(c: f32) -> f32 {
  let a = abs(c);
  let s = select(a * 12.92, 1.055 * pow(a, 1.0 / 2.4) - 0.055, a > 0.0031308);
  return select(-s, s, c >= 0.0);
}

// SMPTE ST 2084. Returns 0..1 where 1.0 is 10000 nits.
fn pqToLinear(e: f32) -> f32 {
  let m1 = 0.1593017578125;
  let m2 = 78.84375;
  let c1 = 0.8359375;
  let c2 = 18.8515625;
  let c3 = 18.6875;
  let ep = pow(max(e, 0.0), 1.0 / m2);
  let num = max(ep - c1, 0.0);
  let den = max(c2 - c3 * ep, 1e-6);
  return pow(num / den, 1.0 / m1);
}

// BT.2408 puts SDR diffuse white at 203 nits, so that is the divisor that makes 1.0 mean white.
const PQ_MAX_NITS = 10000.0;
const SDR_WHITE_NITS = 203.0;

// BT.2020 -> BT.709 primaries.
const BT2020_TO_BT709 = mat3x3f(
  vec3f( 1.6605, -0.1246, -0.0182),
  vec3f(-0.5876,  1.1329, -0.1006),
  vec3f(-0.0728, -0.0083,  1.1187)
);

// Reinhard shoulder above the knee, asymptotic to 1.0. Applied to luminance and reapplied to the
// channels as a ratio, so highlights roll off without dragging hue or saturation with them.
fn toneMap(rgb: vec3f, knee: f32) -> vec3f {
  let l = dot(rgb, vec3f(0.2627, 0.6780, 0.0593));
  if (l <= knee) { return rgb; }
  let range = max(1.0 - knee, 1e-4);
  let mapped = knee + range * (1.0 - exp(-(l - knee) / range));
  return rgb * (mapped / max(l, 1e-6));
}

fn encode(lin: vec3f) -> vec4f {
  let e = vec3f(linearToSrgb(lin.r), linearToSrgb(lin.g), linearToSrgb(lin.b));
  return vec4f(clamp(e, vec3f(0.0), vec3f(1.0)), 1.0);
}

@fragment fn fs(in: VOut) -> @location(0) vec4f {
  let s = textureSampleBaseClampToEdge(tex, samp, in.uv);
  let mode = i32(params.mode + 0.5);

  // 0 — off: whatever Chromium produced, untouched.
  if (mode == 0) { return s; }

  // 1 — rolloff: assume the sample is already display-encoded with headroom above 1.0, and
  // compress that headroom instead of letting the compositor clip it.
  if (mode == 1) {
    var lin = vec3f(srgbToLinear(s.r), srgbToLinear(s.g), srgbToLinear(s.b));
    return encode(toneMap(lin, params.knee));
  }

  // 2 — gamut only: assume the transfer function was handled but the primaries were not.
  if (mode == 2) {
    var lin = vec3f(srgbToLinear(s.r), srgbToLinear(s.g), srgbToLinear(s.b));
    lin = BT2020_TO_BT709 * lin;
    return encode(toneMap(lin, params.knee));
  }

  // 3 — full: assume nothing was converted and the sample is raw PQ in BT.2020. Decode the PQ
  // curve, normalise so diffuse white lands at 1.0, correct the primaries, then roll off.
  var lin = vec3f(pqToLinear(s.r), pqToLinear(s.g), pqToLinear(s.b));
  lin = lin * (PQ_MAX_NITS / SDR_WHITE_NITS);
  lin = BT2020_TO_BT709 * lin;
  return encode(toneMap(lin, params.knee));
}
`

export const TONE_MODES = ['off', 'rolloff', 'gamut', 'full'] as const
export type ToneMode = (typeof TONE_MODES)[number]

// The displays this runs on are BT.709; naming the canvas display-p3 only adds a conversion, and
// the manual paths above produce BT.709 directly.
const CANVAS_COLOR_SPACE: PredefinedColorSpace = 'srgb'

// Linear-light level where the highlight rolloff starts. Below this the image is untouched, so the
// SDR range keeps its contrast and only the headroom is compressed.
const DEFAULT_KNEE = 0.6

export class WebGPURenderer {
  private device: GPUDevice | null = null
  private ctx: GPUCanvasContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private sampler: GPUSampler | null = null
  private params: GPUBuffer | null = null
  private hdr = false
  private mode: ToneMode = 'full'
  private logged = false

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (!navigator.gpu) throw new Error('WebGPU unavailable (navigator.gpu missing)')
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) throw new Error('no WebGPU adapter')
    this.device = await adapter.requestDevice()
    const ctx = canvas.getContext('webgpu')
    if (!ctx) throw new Error('no webgpu canvas context')
    this.ctx = ctx

    const format = 'rgba16float' as GPUTextureFormat
    // toneMapping + colorSpace not yet in lib.dom WebGPU types — cast.
    ctx.configure({
      device: this.device,
      format,
      alphaMode: 'opaque',
      colorSpace: CANVAS_COLOR_SPACE,
      // Every non-off mode already folds the range into [0,1], so the canvas is standard range.
      toneMapping: { mode: 'standard' }
    } as unknown as GPUCanvasConfiguration)

    this.params = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    this.writeParams()

    const module = this.device.createShaderModule({ code: WGSL })
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' }
    })
    this.sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' })
  }

  private writeParams(): void {
    if (!this.device || !this.params) return
    // SDR sources are never reinterpreted — only HDR needs any of this.
    const active = this.hdr ? TONE_MODES.indexOf(this.mode) : 0
    this.device.queue.writeBuffer(this.params, 0, new Float32Array([active, DEFAULT_KNEE, 0, 0]))
  }

  get toneMode(): ToneMode {
    return this.mode
  }

  get sourceIsHdr(): boolean {
    return this.hdr
  }

  setToneMode(mode: ToneMode): void {
    if (mode === this.mode) return
    this.mode = mode
    this.writeParams()
  }

  render(frame: VideoFrame): void {
    const { device, ctx, pipeline, sampler, params } = this
    if (!device || !ctx || !pipeline || !sampler || !params) return
    // The container's HDR flag is not trustworthy — mediabunny reports hasHighDynamicRange()
    // false for HDR10 remuxes that carry no mastering-display metadata, and gating on it
    // silently disabled every correction below. The decoded frame states its own transfer
    // function, so that is what decides.
    // lib.dom's VideoTransferCharacteristics predates BT.2100 and omits pq/hlg, which Chromium
    // does report — widen rather than lose the only reliable HDR signal we have.
    const transfer = frame.colorSpace.transfer as string | null
    const frameIsHdr = transfer === 'pq' || transfer === 'hlg'
    if (frameIsHdr !== this.hdr) {
      this.hdr = frameIsHdr
      this.writeParams()
    }
    if (!this.logged) {
      this.logged = true
      // One line that says whether the decoder even knows this is HDR. If transfer comes back
      // bt709 on an HDR10 file the frame is mistagged and no shader mode can be correct.
      console.log(
        '[hdr] active',
        this.hdr,
        'mode',
        this.mode,
        'frame.colorSpace',
        JSON.stringify(frame.colorSpace),
        'format',
        frame.format
      )
    }
    const ext = device.importExternalTexture({ source: frame, colorSpace: CANVAS_COLOR_SPACE })
    const bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: ext },
        { binding: 2, resource: { buffer: params } }
      ]
    })
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bind)
    pass.draw(3)
    pass.end()
    device.queue.submit([encoder.finish()])
  }

  destroy(): void {
    this.params?.destroy()
    this.params = null
    this.device?.destroy()
    this.device = null
    this.ctx = null
    this.pipeline = null
    this.sampler = null
  }
}
