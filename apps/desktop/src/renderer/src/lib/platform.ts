export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform)

export const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)

const HEVC_MIME = 'video/mp4; codecs="hev1.1.6.L93.B0"'

export function isHevcSupported(): boolean {
  if (typeof window === 'undefined') return false
  const v = document.createElement('video')
  if (v.canPlayType(HEVC_MIME) !== '') return true
  if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(HEVC_MIME)) return true
  return false
}
