import { useRef, useState } from 'react'
import { cn } from '@renderer/lib/cn'

// Chrome primitives shared by the two hls.js players (live fights and web
// players), mirrored from the VOD player (watch.$mediaType.$id.tsx) so all
// three read as the same surface.

export function IconButton({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-10 items-center justify-center text-white outline-none"
      {...rest}
    >
      {children}
    </button>
  )
}

export function VolumeSlider({
  value,
  onChange
}: {
  value: number
  onChange: (v: number) => void
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const pct = value * 100

  const update = (e: React.MouseEvent | MouseEvent): void => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onChange(v)
  }

  const onDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    setDragging(true)
    update(e)
    document.body.style.cursor = 'grabbing'
    const onMove = (ev: MouseEvent): void => update(ev)
    const onUp = (): void => {
      setDragging(false)
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={trackRef}
      onMouseDown={onDown}
      className="relative h-1.5 w-[100px] shrink-0 rounded-full bg-white/18"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white"
        style={{ width: `${pct}%` }}
      />
      <div
        className={cn(
          'absolute -top-[10px] h-7 w-6 -translate-x-1/2',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ left: `${pct}%` }}
      >
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-white" />
      </div>
    </div>
  )
}

// Central Icons "loading-circle" — a div-with-border spinner turns square
// under the app-wide corner-shape: squircle rule; an SVG doesn't.
export function SpinnerIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="32"
      height="32"
      fill="none"
      aria-hidden
      className="animate-spin text-white"
    >
      <path
        d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M20.3681 13.5C19.7463 16.9921 16.9921 19.7463 13.5 20.3681"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BackArrowIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M10 5.75L3.75 12L10 18.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12H20.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BigPlayIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
      <path d="M9.24 2.36C7.41 1.18 5 2.49 5 4.67V19.32C5 21.50 7.41 22.81 9.24 21.63L20.56 14.30C22.23 13.22 22.23 10.77 20.56 9.69L9.24 2.36Z" />
    </svg>
  )
}

export function BigPauseIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
      <path d="M6.75 3C5.23 3 4 4.23 4 5.75V18.25C4 19.76 5.23 21 6.75 21H7.25C8.76 21 10 19.76 10 18.25V5.75C10 4.23 8.76 3 7.25 3H6.75Z" />
      <path d="M16.75 3C15.23 3 14 4.23 14 5.75V18.25C14 19.76 15.23 21 16.75 21H17.25C18.76 21 20 19.76 20 18.25V5.75C20 4.23 18.76 3 17.25 3H16.75Z" />
    </svg>
  )
}

export function VolumeFullIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M13 4.22609C13 3.20722 11.8465 2.61634 11.0196 3.21167L6.08529 6.76439C5.87255 6.91756 5.61705 6.99998 5.35491 6.99998H3.75C2.23122 6.99998 1 8.23119 1 9.74998V14.25C1 15.7688 2.23122 17 3.75 17H5.35491C5.61705 17 5.87255 17.0824 6.08529 17.2356L11.0196 20.7883C11.8465 21.3836 13 20.7927 13 19.7739V4.22609Z"
        fill="currentColor"
      />
      <path
        d="M18.7175 4.22162C19.0104 3.92873 19.4852 3.92873 19.7781 4.22162C21.7679 6.21141 23 8.96244 23 11.9998C23 15.0372 21.7679 17.7882 19.7781 19.778C19.4852 20.0709 19.0104 20.0709 18.7175 19.778C18.4246 19.4851 18.4246 19.0102 18.7175 18.7173C20.4375 16.9973 21.5 14.6234 21.5 11.9998C21.5 9.37624 20.4375 7.00227 18.7175 5.28228C18.4246 4.98939 18.4246 4.51452 18.7175 4.22162Z"
        fill="currentColor"
      />
      <path
        d="M16.4194 7.581C16.1265 7.28811 15.6516 7.28811 15.3587 7.581C15.0658 7.87389 15.0658 8.34876 15.3587 8.64166C16.2191 9.50206 16.75 10.6885 16.75 12.0004C16.75 13.3123 16.2191 14.4988 15.3587 15.3592C15.0658 15.6521 15.0658 16.1269 15.3587 16.4198C15.6516 16.7127 16.1265 16.7127 16.4194 16.4198C17.5496 15.2896 18.25 13.7261 18.25 12.0004C18.25 10.2747 17.5496 8.7112 16.4194 7.581Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function VolumeHalfIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M11.0196 3.21167C11.8465 2.61634 13 3.20722 13 4.22609V19.7739C13 20.7927 11.8465 21.3836 11.0196 20.7883L6.08529 17.2356C5.87255 17.0824 5.61705 17 5.35491 17H3.75C2.23122 17 1 15.7688 1 14.25V9.74998C1 8.23119 2.23122 6.99998 3.75 6.99998H5.35491C5.61705 6.99998 5.87255 6.91756 6.08529 6.76439L11.0196 3.21167Z"
        fill="currentColor"
      />
      <path
        d="M16.4194 7.581C16.1265 7.28811 15.6517 7.28811 15.3588 7.581C15.0659 7.87389 15.0659 8.34876 15.3588 8.64166C16.2192 9.50206 16.75 10.6885 16.75 12.0004C16.75 13.3123 16.2192 14.4988 15.3588 15.3592C15.0659 15.6521 15.0659 16.1269 15.3588 16.4198C15.6517 16.7127 16.1265 16.7127 16.4194 16.4198C17.5496 15.2896 18.25 13.7261 18.25 12.0004C18.25 10.2747 17.5496 8.7112 16.4194 7.581Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function VolumeMuteIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M17 5.93934V4.22585C17 3.20697 15.8465 2.6161 15.0196 3.21143L10.0853 6.76415C9.87255 6.91732 9.61705 6.99973 9.35491 6.99973H7.75C6.23122 6.99973 5 8.23095 5 9.74973V14.2497C5 15.25 5.53405 16.1255 6.33257 16.6068L3.21967 19.7197C2.92678 20.0126 2.92678 20.4874 3.21967 20.7803C3.51256 21.0732 3.98744 21.0732 4.28033 20.7803L20.7803 4.28033C21.0732 3.98744 21.0732 3.51256 20.7803 3.21967C20.4874 2.92678 20.0126 2.92678 19.7197 3.21967L17 5.93934Z"
        fill="currentColor"
      />
      <path
        d="M10.0853 17.2353C10.0578 17.2155 10.0295 17.1969 10.0007 17.1794L17 10.1801V19.7736C17 20.7925 15.8465 21.3834 15.0196 20.788L10.0853 17.2353Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function StreamsGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <path
        d="M6.3 8.5a7 7 0 000 7m11.4-7a7 7 0 010 7M3.5 5.7a11 11 0 000 12.6m17-12.6a11 11 0 010 12.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  )
}

export function FullscreenIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M2 17.25V14.75C2 14.33 2.33 14 2.75 14C3.16 14 3.5 14.33 3.5 14.75V17.25C3.5 17.94 4.05 18.5 4.75 18.5H7.25C7.66 18.5 8 18.83 8 19.25C8 19.66 7.66 20 7.25 20H4.75C3.23 20 2 18.76 2 17.25ZM20.5 17.25V14.75C20.5 14.33 20.83 14 21.25 14C21.66 14 22 14.33 22 14.75V17.25C22 18.76 20.76 20 19.25 20H16.75C16.33 20 16 19.66 16 19.25C16 18.83 16.33 18.5 16.75 18.5H19.25C19.94 18.5 20.5 17.94 20.5 17.25ZM2 9.25V6.75C2 5.23 3.23 4 4.75 4H7.25C7.66 4 8 4.33 8 4.75C8 5.16 7.66 5.5 7.25 5.5H4.75C4.05 5.5 3.5 6.05 3.5 6.75V9.25C3.5 9.66 3.16 10 2.75 10C2.33 10 2 9.66 2 9.25ZM20.5 9.25V6.75C20.5 6.05 19.94 5.5 19.25 5.5H16.75C16.33 5.5 16 5.16 16 4.75C16 4.33 16.33 4 16.75 4H19.25C20.76 4 22 5.23 22 6.75V9.25C22 9.66 21.66 10 21.25 10C20.83 10 20.5 9.66 20.5 9.25Z" />
    </svg>
  )
}

export function ExitFullscreenIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M8 2.75V5.25C8 6.76 6.76 8 5.25 8H2.75C2.33 8 2 7.66 2 7.25C2 6.83 2.33 6.5 2.75 6.5H5.25C5.94 6.5 6.5 5.94 6.5 5.25V2.75C6.5 2.33 6.83 2 7.25 2C7.66 2 8 2.33 8 2.75ZM16 2.75V5.25C16 6.76 17.23 8 18.75 8H21.25C21.66 8 22 7.66 22 7.25C22 6.83 21.66 6.5 21.25 6.5H18.75C18.05 6.5 17.5 5.94 17.5 5.25V2.75C17.5 2.33 17.16 2 16.75 2C16.33 2 16 2.33 16 2.75ZM8 21.25V18.75C8 17.23 6.76 16 5.25 16H2.75C2.33 16 2 16.33 2 16.75C2 17.16 2.33 17.5 2.75 17.5H5.25C5.94 17.5 6.5 18.05 6.5 18.75V21.25C6.5 21.66 6.83 22 7.25 22C7.66 22 8 21.66 8 21.25ZM16 21.25V18.75C16 17.23 17.23 16 18.75 16H21.25C21.66 16 22 16.33 22 16.75C22 17.16 21.66 17.5 21.25 17.5H18.75C18.05 17.5 17.5 18.05 17.5 18.75V21.25C17.5 21.66 17.16 22 16.75 22C16.33 22 16 21.66 16 21.25Z" />
    </svg>
  )
}
