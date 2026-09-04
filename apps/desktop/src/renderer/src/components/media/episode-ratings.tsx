import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m as motion, useReducedMotion } from 'motion/react'
import { SectionTitle } from '@renderer/components/ui/section-title'
import { SkeletonSwap } from '@renderer/components/ui/skeleton-swap'
import { seasonRatingsQuery } from '@renderer/lib/external-queries'
import type { EpisodeRating } from '@renderer/lib/seriesgraph'

const PANEL_H = 260
const PAD = { top: 28, right: 20, bottom: 34, left: 40 }
const CHART_SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const

interface EpisodeRatingsProps {
  tmdbId: number
  season: number
}

export function EpisodeRatings({ tmdbId, season }: EpisodeRatingsProps): React.JSX.Element | null {
  const ratings = useQuery(seasonRatingsQuery(tmdbId))
  const reduced = useReducedMotion()

  const seasons = ratings.data ?? []
  const current = seasons.find((s) => s.season === season)
  const rated = current?.episodes.filter((e) => e.rating !== undefined) ?? []
  // A season with no episodes — or none rated yet — has nothing to plot, so the
  // whole section leaves rather than showing an empty frame.
  if (!ratings.isLoading && rated.length === 0) return null
  const avg = rated.length ? rated.reduce((t, e) => t + e.rating!, 0) / rated.length : undefined

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between px-6">
        <SectionTitle>Episode ratings</SectionTitle>
        <AnimatePresence initial={false} mode="popLayout">
          {avg !== undefined ? (
            <motion.span
              key={season}
              className="text-[13px] text-text-muted"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, filter: 'blur(2px)' }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={
                reduced
                  ? { opacity: 0, transition: { duration: 0 } }
                  : {
                      opacity: 0,
                      y: -4,
                      filter: 'blur(2px)',
                      transition: { duration: 0.1, ease: 'easeOut' }
                    }
              }
              transition={reduced ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' }}
            >
              Season average{' '}
              <span className="font-medium text-text-secondary tabular-nums">{avg.toFixed(1)}</span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="px-6">
        <SkeletonSwap
          ready={!ratings.isLoading}
          reserve={PANEL_H}
          label="Episode ratings"
          skeleton={
            <div
              className="w-full animate-pulse rounded-xl bg-white/[0.04]"
              style={{ height: PANEL_H }}
            />
          }
        >
          <div
            className="relative overflow-hidden rounded-xl bg-surface-2"
            style={{ height: PANEL_H }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={season}
                className="h-full w-full"
                initial={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: 0 } }
                    : {
                        opacity: 0,
                        filter: 'blur(2px)',
                        transition: { duration: 0.1, ease: 'easeOut' }
                      }
                }
                transition={reduced ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' }}
              >
                {current && rated.length > 0 ? (
                  <RatingsChart episodes={current.episodes} season={season} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </SkeletonSwap>
      </div>
    </section>
  )
}

interface Point {
  x: number
  y: number
  ep: EpisodeRating
}

function RatingsChart({
  episodes,
  season
}: {
  episodes: EpisodeRating[]
  season: number
}): React.JSX.Element {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const reduced = useReducedMotion()
  const gradientId = `ep-ratings-fade-${season}`

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = (): void => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ordered = useMemo(() => episodes.toSorted((a, b) => a.episode - b.episode), [episodes])

  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = PANEL_H - PAD.top - PAD.bottom
  const n = ordered.length

  const { pts, lo, hi, ticks } = useMemo(() => {
    const values = ordered.filter((e) => e.rating !== undefined).map((e) => e.rating!)
    const min = Math.min(...values)
    const max = Math.max(...values)
    let lo = Math.floor((min - 0.25) * 2) / 2
    let hi = Math.ceil((max + 0.25) * 2) / 2
    if (hi - lo < 1) {
      lo -= 0.5
      hi += 0.5
    }
    lo = Math.max(0, lo)
    hi = Math.min(10, hi)

    const span = hi - lo
    const step = span <= 2 ? 0.5 : span <= 5 ? 1 : 2
    const ticks: number[] = []
    for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) {
      ticks.push(Number(t.toFixed(1)))
    }

    const xFor = (i: number): number =>
      n === 1 ? PAD.left + innerW / 2 : PAD.left + (i * innerW) / (n - 1)
    const yFor = (v: number): number => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH

    const pts: Point[] = []
    ordered.forEach((ep, i) => {
      if (ep.rating === undefined) return
      pts.push({ x: xFor(i), y: yFor(ep.rating), ep })
    })
    return { pts, lo, hi, ticks }
  }, [ordered, n, innerW, innerH])

  const linePath = pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const baseY = PAD.top + innerH
  const areaPath =
    pts.length >= 2
      ? `${linePath} L${pts[pts.length - 1]!.x} ${baseY} L${pts[0]!.x} ${baseY} Z`
      : null

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 48))))
  const maxIdx = pts.reduce((best, p, k) => (p.y < pts[best]!.y ? k : best), 0)

  const activePt = active !== null ? pts[active] : undefined
  const ratedCount = pts.length
  const avg = ratedCount ? pts.reduce((t, p) => t + p.ep.rating!, 0) / ratedCount : 0

  const onPointerMove = (e: React.PointerEvent): void => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || pts.length === 0) return
    const lx = e.clientX - rect.left
    let best = 0
    let bd = Infinity
    pts.forEach((p, k) => {
      const d = Math.abs(p.x - lx)
      if (d < bd) {
        bd = d
        best = k
      }
    })
    setActive(best)
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowRight') {
      setActive((a) => (a === null ? 0 : Math.min(a + 1, pts.length - 1)))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      setActive((a) => (a === null ? pts.length - 1 : Math.max(a - 1, 0)))
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setActive(null)
    }
  }

  const tooltipAbove = activePt ? activePt.y > 96 : true
  const clampedX = activePt ? Math.min(Math.max(activePt.x, 92), Math.max(width - 92, 92)) : 0

  return (
    <div
      ref={wrap}
      tabIndex={0}
      role="img"
      aria-label={`Episode ratings chart for season ${season}: ${ratedCount} of ${n} episodes rated, averaging ${avg.toFixed(1)}. Use the arrow keys to inspect episodes.`}
      className="relative h-full w-full rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-white/25"
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
    >
      {width > 0 ? (
        <svg
          ref={svgRef}
          width={width}
          height={PANEL_H}
          className="block"
          onPointerMove={onPointerMove}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.1" />
              <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => {
            const y = PAD.top + (1 - (t - lo) / (hi - lo)) * innerH
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y}
                  y2={y}
                  className="stroke-white/[0.06]"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 10}
                  y={y}
                  dy={3.5}
                  textAnchor="end"
                  fontSize={10.5}
                  className="fill-text-muted tabular-nums"
                >
                  {t.toFixed(1)}
                </text>
              </g>
            )
          })}

          {ordered.map((ep, i) =>
            i % labelEvery === 0 ? (
              <text
                key={ep.episode}
                x={n === 1 ? PAD.left + innerW / 2 : PAD.left + (i * innerW) / (n - 1)}
                y={PANEL_H - 12}
                textAnchor="middle"
                fontSize={10.5}
                className="fill-text-muted tabular-nums"
              >
                {`E${ep.episode}`}
              </text>
            ) : null
          )}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
          {pts.length >= 2 ? (
            <path
              d={linePath}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-accent"
            />
          ) : null}

          {pts.map((p, k) => (
            <circle
              key={p.ep.episode}
              cx={p.x}
              cy={p.y}
              r={active === k ? 5.5 : 4}
              strokeWidth={2}
              className="fill-accent stroke-surface-2"
              style={{ transition: 'r 150ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          ))}

          {active !== maxIdx ? (
            <text
              x={pts[maxIdx]!.x}
              y={pts[maxIdx]!.y - 12}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              className="fill-text-secondary tabular-nums"
            >
              {pts[maxIdx]!.ep.rating!.toFixed(1)}
            </text>
          ) : null}
        </svg>
      ) : null}

      <AnimatePresence>
        {activePt ? (
          <>
            <motion.div
              key="crosshair"
              aria-hidden
              className="pointer-events-none absolute left-0 w-px bg-white/[0.1]"
              style={{ top: PAD.top, height: innerH }}
              initial={{ opacity: 0, x: activePt.x }}
              animate={{ opacity: 1, x: activePt.x }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeOut' } }}
              transition={reduced ? { duration: 0 } : CHART_SPRING}
            />
            <motion.div
              key="tooltip"
              aria-hidden
              className={
                tooltipAbove
                  ? 'pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-full'
                  : 'pointer-events-none absolute top-0 left-0 -translate-x-1/2'
              }
              initial={{
                opacity: 0,
                scale: 0.98,
                x: clampedX,
                y: tooltipAbove ? activePt.y - 14 : activePt.y + 14
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: clampedX,
                y: tooltipAbove ? activePt.y - 14 : activePt.y + 14
              }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: 'easeOut' } }}
              transition={reduced ? { duration: 0 } : CHART_SPRING}
            >
              <div className="flex max-w-[168px] flex-col gap-0.5 rounded-lg bg-surface-3 px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                <span className="text-[15px] leading-5 font-semibold text-text">
                  {activePt.ep.rating!.toFixed(1)}
                </span>
                <span className="truncate text-[12px] leading-4 text-text-secondary">
                  {`E${activePt.ep.episode}${activePt.ep.name ? ` · ${activePt.ep.name}` : ''}`}
                </span>
                {activePt.ep.votes !== undefined ? (
                  <span className="text-[11px] leading-4 text-text-muted tabular-nums">
                    {`${activePt.ep.votes.toLocaleString()} votes`}
                  </span>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <span role="status" className="sr-only">
        {activePt
          ? `Episode ${activePt.ep.episode}${activePt.ep.name ? `, ${activePt.ep.name}` : ''}: rated ${activePt.ep.rating!.toFixed(1)}`
          : ''}
      </span>
    </div>
  )
}
