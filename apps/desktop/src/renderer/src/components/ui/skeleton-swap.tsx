import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion, useReducedMotion } from 'motion/react'
import { cn } from '@renderer/lib/cn'
import { useSkeletonSwap } from '@renderer/lib/use-skeleton-swap'

const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const

const WIDTHS = [100, 93, 97, 88, 95, 91] as const

function widthFor(index: number, total: number): number {
  if (total > 1 && index === total - 1) return 62
  return WIDTHS[(index * 7 + 3) % WIDTHS.length] ?? 100
}

export type SkeletonSwapProps = {
  ready: boolean
  children: React.ReactNode
  lines?: number
  lineHeight?: number
  barHeight?: number
  /** Explicit box height, or 'auto' to let the surrounding layout size the box. */
  reserve?: number | 'auto'
  delay?: number
  minVisible?: number
  label?: string
  skeleton?: React.ReactNode
  className?: string
}

export function SkeletonSwap({
  ready,
  children,
  lines = 3,
  lineHeight = 21,
  barHeight = 9,
  reserve,
  delay = 120,
  minVisible = 380,
  label,
  skeleton,
  className = ''
}: SkeletonSwapProps): React.JSX.Element {
  const { showSkeleton } = useSkeletonSwap({ ready, delay, minVisible })
  const reduced = useReducedMotion()

  const shell = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)

  const box = reserve === 'auto' ? undefined : (reserve ?? lines * lineHeight)

  useEffect(() => {
    const el = shell.current
    const inner = body.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const check = (): void => setScrollable(el.scrollHeight - el.clientHeight > 1)
    check()

    const ro = new ResizeObserver(check)
    ro.observe(el)
    if (inner) ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={shell}
      aria-busy={!ready}
      aria-label={label}
      tabIndex={scrollable ? 0 : undefined}
      style={box !== undefined ? { height: box } : undefined}
      className={cn(
        'relative grid',
        box !== undefined && 'overflow-y-auto overscroll-contain',
        className
      )}
    >
      <motion.div
        ref={body}
        className="col-start-1 row-start-1 min-w-0"
        initial={false}
        animate={
          reduced
            ? { opacity: showSkeleton ? 0 : 1 }
            : {
                opacity: showSkeleton ? 0 : 1,
                scale: showSkeleton ? 0.99 : 1,
                filter: showSkeleton ? 'blur(4px)' : 'blur(0px)'
              }
        }
        transition={reduced ? { duration: 0 } : CROSSFADE}
        style={{
          transformOrigin: 'top left',
          pointerEvents: showSkeleton ? 'none' : undefined
        }}
      >
        {children}
      </motion.div>

      <AnimatePresence initial={false}>
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            aria-hidden
            className="pointer-events-none col-start-1 row-start-1 w-full self-start"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
            transition={reduced ? { duration: 0 } : CROSSFADE}
          >
            {skeleton ?? (
              <div className="w-full">
                {Array.from({ length: lines }, (_, i) => (
                  <div key={i} className="flex items-center" style={{ height: lineHeight }}>
                    <div
                      className="rounded-[5px] bg-white/[0.06]"
                      style={{ height: barHeight, width: `${widthFor(i, lines)}%` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {label ? (
        <span role="status" className="sr-only">
          {ready ? `${label} loaded` : ''}
        </span>
      ) : null}
    </div>
  )
}
