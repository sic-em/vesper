import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@renderer/lib/cn'
import { ChevronLeftIcon, ChevronRightIcon } from '@renderer/components/icons'

interface Props {
  scrollRef: React.RefObject<HTMLDivElement | null>
}

const HOLD_THRESHOLD_MS = 200
const HOLD_RAMP_MS = 300
const HOLD_MIN_PX = 8
const HOLD_MAX_PX = 80

export function ScrollChevrons({ scrollRef }: Props): React.JSX.Element {
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = (): void => {
      setCanPrev(el.scrollLeft > 0)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [scrollRef])

  const singleJump = useCallback(
    (dir: -1 | 1): void => {
      const el = scrollRef.current
      if (!el) return
      el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
    },
    [scrollRef]
  )

  const activeDirRef = useRef<-1 | 1 | 0>(0)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const holdingRef = useRef(false)
  const holdStartRef = useRef(0)

  const stopAll = useCallback((): void => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startPress = useCallback(
    (dir: -1 | 1): void => {
      // Cancel any leftover hold from a prior interaction.
      stopAll()
      activeDirRef.current = dir
      holdingRef.current = false
      holdTimerRef.current = setTimeout(() => {
        holdingRef.current = true
        holdStartRef.current = performance.now()
        const tick = (now: number): void => {
          const el = scrollRef.current
          if (!el || !holdingRef.current) return
          const elapsed = now - holdStartRef.current
          const t = Math.min(1, elapsed / HOLD_RAMP_MS)
          const speed = HOLD_MIN_PX + (HOLD_MAX_PX - HOLD_MIN_PX) * t
          el.scrollLeft += activeDirRef.current * speed
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }, HOLD_THRESHOLD_MS)
    },
    [scrollRef, stopAll]
  )

  const endPress = useCallback((): void => {
    const wasHolding = holdingRef.current
    const dir = activeDirRef.current
    stopAll()
    holdingRef.current = false
    activeDirRef.current = 0
    if (!wasHolding && dir !== 0) singleJump(dir)
  }, [singleJump, stopAll])

  // Global pointerup so release outside the button still ends the hold cleanly.
  useEffect(() => {
    const onUp = (): void => {
      if (activeDirRef.current !== 0) endPress()
    }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [endPress])

  const base = cn(
    'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 active:scale-95'
  )

  return (
    <>
      {canPrev ? (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            startPress(-1)
          }}
          aria-label="Scroll left"
          className={cn(base, 'left-2 outline-none')}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            startPress(1)
          }}
          aria-label="Scroll right"
          className={cn(base, 'right-2 outline-none')}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      ) : null}
    </>
  )
}
