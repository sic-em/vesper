/// <reference types="@webgpu/types" />

// The Anime4K GPU chains, isolated behind a dynamic import: the anime4k-webgpu package embeds
// its CNN weights as WGSL source, so this module only loads once upscaling actually engages.
import {
  ClampHighlights,
  CNNM,
  CNNUL,
  CNNVL,
  CNNx2M,
  CNNx2UL,
  CNNx2VL,
  type Anime4KPipeline
} from 'anime4k-webgpu'
import type { Anime4kPreset } from './anime4k'

/**
 * Every tier is the upstream Mode A shape — clamp highlights, restore lines, 2x CNN upscale —
 * at a different network size (ADR-0015). Output is always exactly 2x the input texture.
 */
export function buildAnime4kChain(
  device: GPUDevice,
  inputTexture: GPUTexture,
  preset: Anime4kPreset
): Anime4KPipeline[] {
  const clamp = new ClampHighlights({ device, inputTexture })
  const clamped = clamp.getOutputTexture()
  let restore: Anime4KPipeline
  let upscale: Anime4KPipeline
  switch (preset) {
    case 'quality':
      restore = new CNNUL({ device, inputTexture: clamped })
      upscale = new CNNx2UL({ device, inputTexture: restore.getOutputTexture() })
      break
    case 'balanced':
      restore = new CNNVL({ device, inputTexture: clamped })
      upscale = new CNNx2VL({ device, inputTexture: restore.getOutputTexture() })
      break
    case 'performance':
      restore = new CNNM({ device, inputTexture: clamped })
      upscale = new CNNx2M({ device, inputTexture: restore.getOutputTexture() })
      break
  }
  return [clamp, restore, upscale]
}
