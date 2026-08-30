/// <reference types="@webgpu/types" />

// Full-screen triangle sampling a WebCodecs VideoFrame as an external texture.
// rgba16float canvas + extended tone mapping preserves HDR10 (proven in spike.tsx / ADR-0007).
const WGSL = /* wgsl */ `
@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var tex: texture_external;

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2f,3>(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0));
  var uv = array<vec2f,3>(vec2f(0.0,1.0), vec2f(2.0,1.0), vec2f(0.0,-1.0));
  var o: VOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = uv[i];
  return o;
}

@fragment fn fs(in: VOut) -> @location(0) vec4f {
  return textureSampleBaseClampToEdge(tex, samp, in.uv);
}
`

export class WebGPURenderer {
  private device: GPUDevice | null = null
  private ctx: GPUCanvasContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private sampler: GPUSampler | null = null

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
      colorSpace: 'display-p3',
      toneMapping: { mode: 'extended' }
    } as unknown as GPUCanvasConfiguration)

    const module = this.device.createShaderModule({ code: WGSL })
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' }
    })
    this.sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' })
  }

  render(frame: VideoFrame): void {
    const { device, ctx, pipeline, sampler } = this
    if (!device || !ctx || !pipeline || !sampler) return
    const ext = device.importExternalTexture({ source: frame })
    const bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: ext }
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
    this.device?.destroy()
    this.device = null
    this.ctx = null
    this.pipeline = null
    this.sampler = null
  }
}
