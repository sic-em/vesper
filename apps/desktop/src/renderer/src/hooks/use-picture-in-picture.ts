import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

// Canvas capture only samples the canvas when something draws to it, and the engine draws only
// when it renders a decoded frame — so a paused player feeds the capture stream nothing at all,
// and the PiP window has no frame to open on. Asking the engine to redraw the frame already on
// screen is what keeps the stream alive while paused.
const PAUSED_REPAINT_MS = 250
const OPENING_REPAINT_MS = 60
const FIRST_FRAME_TIMEOUT_MS = 3000

export interface PictureInPicture {
  active: boolean
  toggle: () => Promise<void>
}

/**
 * Picture-in-picture for the canvas-based player.
 *
 * The engine renders to a WebGPU canvas rather than a <video>, so PiP runs off a hidden video
 * element fed by the canvas capture stream. That hidden element is also the bridge for the PiP
 * window's own transport controls: its play/pause state is kept in lockstep with the engine in
 * both directions, so the PiP button shows the real state and toggling it drives real playback.
 */
export function usePictureInPicture(args: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  paused: boolean
  hasFrame: boolean
  play: () => void
  pause: () => void
  repaint: () => boolean
  onUnavailable: (message: string) => void
}): PictureInPicture {
  const { canvasRef, paused, hasFrame, play, pause, repaint, onUnavailable } = args

  const [active, setActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // What we last asked the element to do ourselves, so its own play/pause events are not mistaken
  // for the viewer pressing the button in the PiP window.
  const selfDrivenRef = useRef<'play' | 'pause' | null>(null)

  // The engine controls are fresh every render; the video listeners are attached once and the
  // repaint ticks must not restart on every render, so both read through a ref.
  const engineRef = useRef({ play, pause, repaint, paused })
  useEffect(() => {
    engineRef.current = { play, pause, repaint, paused }
  })

  const drive = useCallback((video: HTMLVideoElement, action: 'play' | 'pause'): void => {
    if (action === 'pause') {
      if (video.paused) return
      selfDrivenRef.current = 'pause'
      video.pause()
      return
    }
    if (!video.paused) return
    selfDrivenRef.current = 'play'
    void video.play().catch(() => {
      selfDrivenRef.current = null
    })
  }, [])

  const stopCapture = useCallback(
    (video = videoRef.current): void => {
      if (!video) return
      const stream = video.srcObject as MediaStream | null
      stream?.getTracks().forEach((t) => t.stop())
      drive(video, 'pause')
      video.srcObject = null
    },
    [drive]
  )

  const ensureVideo = useCallback((): HTMLVideoElement => {
    const existing = videoRef.current
    if (existing) return existing

    const video = document.createElement('video')
    // Audio comes from the engine's own pipeline; this element carries picture only.
    video.muted = true
    video.playsInline = true
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'

    video.addEventListener('enterpictureinpicture', () => setActive(true))
    video.addEventListener('leavepictureinpicture', () => {
      setActive(false)
      stopCapture()
    })
    // The PiP window's transport buttons act on this element (directly, or through the media
    // session handlers) — forward them to the engine, ignoring the echoes of our own syncing.
    video.addEventListener('play', () => {
      if (selfDrivenRef.current === 'play') {
        selfDrivenRef.current = null
        return
      }
      if (engineRef.current.paused) engineRef.current.play()
    })
    video.addEventListener('pause', () => {
      if (selfDrivenRef.current === 'pause') {
        selfDrivenRef.current = null
        return
      }
      if (!engineRef.current.paused) engineRef.current.pause()
    })

    document.body.appendChild(video)
    videoRef.current = video
    return video
  }, [stopCapture])

  const toggle = useCallback(async (): Promise<void> => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        return
      }
      const canvas = canvasRef.current
      if (!canvas?.width || !document.pictureInPictureEnabled) {
        onUnavailable('Picture-in-picture unavailable')
        return
      }
      // Nothing has been drawn yet, so there is no picture to hand over — and play() below would
      // wait on a stream that never produces a frame.
      if (!hasFrame) {
        onUnavailable('Picture-in-picture needs a rendered frame')
        return
      }
      const video = ensureVideo()
      video.srcObject = canvas.captureStream()
      // Opening while paused: nudge the engine until the stream has delivered a frame, so the
      // window appears on the frozen picture instead of waiting for playback to resume.
      const nudge = setInterval(() => {
        if (engineRef.current.paused) engineRef.current.repaint()
      }, OPENING_REPAINT_MS)
      try {
        engineRef.current.repaint()
        await waitForFirstFrame(video)
        // Chromium hands over a playing element; the engine stays paused, and the element is put
        // back in step below.
        selfDrivenRef.current = 'play'
        await video.play()
        await video.requestPictureInPicture()
      } finally {
        clearInterval(nudge)
      }
      // Opened on a paused video: leave the PiP window showing a frozen frame and a play button,
      // not a stream pretending to run.
      if (engineRef.current.paused) drive(video, 'pause')
    } catch (err) {
      console.error('picture-in-picture failed', err)
      selfDrivenRef.current = null
      stopCapture()
      onUnavailable('Picture-in-picture failed')
    }
  }, [canvasRef, drive, ensureVideo, hasFrame, onUnavailable, stopCapture])

  // Engine -> PiP window: pausing from the main player (or a keyboard shortcut) has to show up on
  // the PiP window's play/pause button too.
  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    if (!video) return
    drive(video, paused ? 'pause' : 'play')
  }, [active, drive, paused])

  // A paused engine stops feeding the capture stream; keep the current frame flowing so the PiP
  // window has something to show the moment it needs it.
  useEffect(() => {
    if (!active || !paused) return
    const id = setInterval(() => engineRef.current.repaint(), PAUSED_REPAINT_MS)
    return () => clearInterval(id)
  }, [active, paused])

  useEffect(() => {
    return () => {
      if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {})
      stopCapture()
      videoRef.current?.remove()
      videoRef.current = null
    }
  }, [stopCapture])

  return { active, toggle }
}

function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer)
      video.removeEventListener('loadeddata', onData)
    }
    const onData = (): void => {
      cleanup()
      resolve()
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('canvas capture produced no frame'))
    }, FIRST_FRAME_TIMEOUT_MS)
    video.addEventListener('loadeddata', onData)
  })
}
