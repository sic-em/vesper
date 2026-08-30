import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { StarSolidIcon } from '@renderer/components/icons'
import { cn } from '@renderer/lib/cn'

const SWAP_EASE = 'cubic-bezier(0.22,1,0.36,1)'
const RESIZE_MS = 220
const STAR_STAGGER_MS = 35
const PULSE_MS = 140

export function RatingButton({
  mediaType,
  tmdbId,
  title,
  posterPath
}: {
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  posterPath?: string
}): React.JSX.Element {
  const rating = useQuery(api.ratings.getRating, { mediaType, tmdbId })
  const setRating = useMutation(api.ratings.setRating)
  const unsetRating = useMutation(api.ratings.unsetRating)
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  const [pressed, setPressed] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pulseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!expanded) return
    const onDocClick = (e: MouseEvent): void => {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target as Node)) return
      setExpanded(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  const current = rating ?? 0
  const display = hovered ?? current

  const pick = (n: number): void => {
    if (current === n) {
      void unsetRating({ mediaType, tmdbId })
    } else {
      void setRating({ mediaType, tmdbId, score: n, title, posterPath })
    }
    setExpanded(false)
    setHovered(null)
  }

  const flashPulse = (): void => {
    if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current)
    setPressed(true)
    pulseTimerRef.current = window.setTimeout(() => setPressed(false), PULSE_MS)
  }

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (expanded) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable)
      ) {
        return
      }
      if (!/^[1-5]$/.test(e.key)) return
      e.preventDefault()
      const n = Number(e.key)
      pick(n)
      flashPulse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, expanded, mediaType, tmdbId, title, posterPath])

  return (
    <div
      ref={rootRef}
      className="inline-flex h-10 shrink-0 items-center overflow-hidden rounded-[14px] bg-overlay-soft"
      style={{
        width: expanded ? '188px' : current > 0 ? '60px' : '40px',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: `width ${RESIZE_MS}ms ${SWAP_EASE}, transform ${PULSE_MS}ms ${SWAP_EASE}`,
        willChange: 'width, transform'
      }}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(true)
          }}
          aria-label={current > 0 ? `Rated ${current} of 5 — change` : 'Rate'}
          className={cn(
            'flex h-full w-full items-center justify-center gap-1 px-2 text-text outline-none transition-transform duration-150 active:scale-[0.97]'
          )}
        >
          <StarSolidIcon className={cn('size-4', current > 0 ? 'text-text' : 'text-text')} />
          {current > 0 ? (
            <span className="text-[13px] leading-4 font-semibold text-text tabular-nums">
              {current}
            </span>
          ) : null}
        </button>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center gap-1 px-2"
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4, 5].map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                pick(n)
              }}
              onMouseEnter={() => setHovered(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="rating-star-in flex size-8 items-center justify-center outline-none active:scale-[0.92] transition-transform duration-100"
              style={{ animationDelay: `${i * STAR_STAGGER_MS}ms` }}
            >
              <StarSolidIcon
                className={cn(
                  'size-4 transition-colors duration-100',
                  n <= display ? 'text-text' : 'text-text-muted'
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
