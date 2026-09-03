// Sentinel-driven infinite loader, ported from interior.dev's Load More
// (https://www.interior.dev/docs/load-more) and restyled to Vesper's tokens.
import { useCallback, useEffect, useRef, useState } from 'react'
import { m as motion, useReducedMotion } from 'motion/react'
import { cn } from '@renderer/lib/cn'
import { useScrollContainer } from '@renderer/lib/scroll-container'

const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const
const INSTANT = { duration: 0 } as const

export type LoadMoreStatus = 'idle' | 'loading' | 'error' | 'end'

export interface UseLoadMoreOptions {
  onLoad: () => unknown
  hasMore?: boolean
  rootMargin?: string
  maxAutoLoads?: number
  rootRef?: React.RefObject<Element | null> | null
}

export interface UseLoadMoreReturn {
  status: LoadMoreStatus
  sentinelRef: React.RefObject<HTMLDivElement | null>
  load: () => void
}

export function useLoadMore({
  onLoad,
  hasMore = true,
  rootMargin = '600px 0px',
  maxAutoLoads = 4,
  rootRef
}: UseLoadMoreOptions): UseLoadMoreReturn {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'error'>('idle')

  const sentinelRef = useRef<HTMLDivElement>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  const seq = useRef(0)
  const busy = useRef(false)
  const alive = useRef(true)
  const runs = useRef(0)
  const blocked = useRef(false)

  const fetchMore = useRef(onLoad)
  fetchMore.current = onLoad
  const more = useRef(hasMore)
  more.current = hasMore

  const reobserve = useCallback((): void => {
    const io = observer.current
    const el = sentinelRef.current
    if (io && el) {
      io.unobserve(el)
      io.observe(el)
    }
  }, [])

  const run = useCallback(
    (manual: boolean): void => {
      if (busy.current || !more.current) return

      if (manual) {
        runs.current = 0
        blocked.current = false
      } else {
        // After a few back-to-back auto loads the button waits for a click, so a flick
        // of the wheel can't queue up a dozen TMDB pages.
        if (blocked.current || runs.current >= maxAutoLoads) return
        runs.current += 1
      }

      busy.current = true
      const id = ++seq.current
      setPhase('loading')

      Promise.resolve()
        .then(() => fetchMore.current())
        .then(
          () => {
            busy.current = false
            if (!alive.current || id !== seq.current) return
            setPhase('idle')
            reobserve()
          },
          () => {
            busy.current = false
            if (!alive.current || id !== seq.current) return
            blocked.current = true
            setPhase('error')
          }
        )
    },
    [maxAutoLoads, reobserve]
  )

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        if (entry.isIntersecting) {
          run(false)
          return
        }
        runs.current = 0
      },
      { root: rootRef?.current ?? null, rootMargin, threshold: 0 }
    )

    observer.current = io
    io.observe(el)

    return () => {
      io.disconnect()
      observer.current = null
    }
  }, [hasMore, rootMargin, rootRef, run])

  const load = useCallback((): void => run(true), [run])

  const status: LoadMoreStatus = !hasMore ? 'end' : phase

  return { status, sentinelRef, load }
}

const LABELS: Record<LoadMoreStatus, string> = {
  idle: 'Load more',
  loading: 'Loading',
  error: "Couldn't load more. Try again",
  end: "That's everything"
}

const ORDER: LoadMoreStatus[] = ['idle', 'loading', 'error', 'end']

const TONE: Record<LoadMoreStatus, string> = {
  idle: 'text-text-tertiary',
  loading: 'text-text-muted',
  error: 'text-[#ff7a70]',
  end: 'text-text-muted'
}

function ChevronMark(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden className="shrink-0">
      <path
        d="M2.6 4.2 5.5 7.1 8.4 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckMark(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden className="shrink-0">
      <path
        d="M2.2 5.7 4.5 8 8.8 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlertMark(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden className="shrink-0">
      <path d="M5.5 2.4v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4.7" y="7.5" width="1.6" height="1.6" rx="0.4" fill="currentColor" />
    </svg>
  )
}

function SpinnerMark({ spinning }: { spinning: boolean }): React.JSX.Element {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      aria-hidden
      className={cn('shrink-0', spinning && 'animate-spin')}
    >
      <circle cx="5.5" cy="5.5" r="3.9" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path
        d="M5.5 1.6a3.9 3.9 0 0 1 3.9 3.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export interface LoadMoreProps {
  onLoad: () => unknown
  hasMore?: boolean
  rootMargin?: string
  maxAutoLoads?: number
  className?: string
}

export function LoadMore({
  onLoad,
  hasMore = true,
  rootMargin = '600px 0px',
  maxAutoLoads = 4,
  className
}: LoadMoreProps): React.JSX.Element {
  const reduced = useReducedMotion()
  const scrollRef = useScrollContainer()
  const { status, sentinelRef, load } = useLoadMore({
    onLoad,
    hasMore,
    rootMargin,
    maxAutoLoads,
    rootRef: scrollRef
  })

  const fade = reduced ? INSTANT : CROSSFADE
  const inert = status === 'loading' || status === 'end'

  const icons: Record<LoadMoreStatus, React.ReactNode> = {
    idle: <ChevronMark />,
    loading: <SpinnerMark spinning={status === 'loading' && !reduced} />,
    error: <AlertMark />,
    end: <CheckMark />
  }

  return (
    <div className={cn('relative flex w-full justify-center', className)}>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
      />

      <button
        type="button"
        aria-busy={status === 'loading' || undefined}
        aria-disabled={inert || undefined}
        aria-label={LABELS[status]}
        onClick={(event) => {
          if (inert) {
            event.preventDefault()
            return
          }
          load()
        }}
        className={cn(
          'relative inline-flex h-8 items-center justify-center rounded-full bg-transparent px-4 text-[12px] font-medium outline-none transition-colors select-none',
          inert ? 'cursor-default' : 'hover:bg-white/[0.06] active:opacity-70'
        )}
      >
        <span aria-hidden className="relative grid place-items-center">
          {ORDER.map((s) => (
            <motion.span
              key={s}
              initial={false}
              animate={
                s === status
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 3, filter: 'blur(3px)' }
              }
              transition={fade}
              className={cn(
                'col-start-1 row-start-1 flex items-center gap-1.5 whitespace-nowrap',
                TONE[s]
              )}
            >
              {icons[s]}
              {LABELS[s]}
            </motion.span>
          ))}
        </span>
      </button>

      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'error' || status === 'end' ? LABELS[status] : ''}
      </span>
    </div>
  )
}
