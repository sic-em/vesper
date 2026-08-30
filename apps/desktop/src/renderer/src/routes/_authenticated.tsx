import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { Allotment, LayoutPriority, type AllotmentHandle } from 'allotment'
import 'allotment/dist/style.css'
import { TopBar } from '@renderer/components/layout/top-bar'
import { LeftSidebar } from '@renderer/components/layout/left-sidebar'
import { RightSidebar } from '@renderer/components/layout/right-sidebar'
import { useNotificationSound } from '@renderer/hooks/use-notification-sound'
import { popularMoviesQuery, trendingTvQuery } from '@renderer/lib/tmdb-queries'
import { usePersistedState } from '@renderer/hooks/use-persisted-state'

interface ShellLayout {
  leftWidth: number
  rightWidth: number
  leftVisible: boolean
  rightVisible: boolean
}

const LEFT_DEFAULT = 280
const RIGHT_DEFAULT = 280
const LEFT_MAX = 400
const RIGHT_MAX = 400
const ANIM_MS = 220
const SHELL_PAD = 16
const SNAP_THRESHOLD = 10

const INITIAL: ShellLayout = {
  leftWidth: LEFT_DEFAULT,
  rightWidth: RIGHT_DEFAULT,
  leftVisible: true,
  rightVisible: true
}

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading) return
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/signin',
        search: { redirect: location.href }
      })
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(popularMoviesQuery()),
      context.queryClient.ensureQueryData(trendingTvQuery())
    ]),
  component: AuthedLayout
})

function AuthedLayout(): React.JSX.Element {
  const [layout, setLayout] = usePersistedState<ShellLayout>('vesper.layout.shell', INITIAL)
  const allotmentRef = useRef<AllotmentHandle>(null)
  const initialLeft = layout.leftVisible ? layout.leftWidth : 0
  const initialRight = layout.rightVisible ? layout.rightWidth : 0
  const [liveLeft, setLiveLeft] = useState(initialLeft)
  const [liveRight, setLiveRight] = useState(initialRight)
  const initialTotal =
    typeof window !== 'undefined' ? Math.max(800, window.innerWidth - SHELL_PAD) : 1440
  const sizesRef = useRef<number[]>([
    initialLeft,
    Math.max(0, initialTotal - initialLeft - initialRight),
    initialRight
  ])
  const animatingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useNotificationSound()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  const tween = (target: number[], onDone?: () => void): void => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    animatingRef.current = true
    const start = sizesRef.current.slice()
    const t0 = performance.now()
    const step = (): void => {
      const t = Math.min(1, (performance.now() - t0) / ANIM_MS)
      const k = easeOutQuart(t)
      const next = start.map((s, i) => Math.round(s + ((target[i] ?? s) - s) * k))
      allotmentRef.current?.resize(next)
      sizesRef.current = next
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        animatingRef.current = false
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const total = (): number => sizesRef.current.reduce((a, b) => a + b, 0)
  const target = (l: number, r: number): number[] => [l, Math.max(0, total() - l - r), r]

  const collapseLeft = (): void => {
    tween(target(0, sizesRef.current[2] ?? 0), () => {
      setLayout((p) => ({ ...p, leftVisible: false }))
    })
  }
  const expandLeft = (): void => {
    setLayout((p) => ({ ...p, leftVisible: true }))
    tween(target(layout.leftWidth || LEFT_DEFAULT, sizesRef.current[2] ?? 0))
  }
  const collapseRight = (): void => {
    tween(target(sizesRef.current[0] ?? 0, 0), () => {
      setLayout((p) => ({ ...p, rightVisible: false }))
    })
  }
  const expandRight = (): void => {
    setLayout((p) => ({ ...p, rightVisible: true }))
    tween(target(sizesRef.current[0] ?? 0, layout.rightWidth || RIGHT_DEFAULT))
  }

  const handleChange = (sizes: number[]): void => {
    let next = sizes
    if (!animatingRef.current) {
      const [l, c, r] = sizes
      let snappedL = l
      let snappedC = c
      let snappedR = r
      if (l !== undefined && l > 0 && Math.abs(l - LEFT_DEFAULT) <= SNAP_THRESHOLD) {
        const delta = LEFT_DEFAULT - l
        snappedL = LEFT_DEFAULT
        snappedC = (c ?? 0) - delta
      }
      if (r !== undefined && r > 0 && Math.abs(r - RIGHT_DEFAULT) <= SNAP_THRESHOLD) {
        const delta = RIGHT_DEFAULT - r
        snappedR = RIGHT_DEFAULT
        snappedC = (snappedC ?? 0) - delta
      }
      if (snappedL !== l || snappedR !== r) {
        next = [snappedL ?? 0, snappedC ?? 0, snappedR ?? 0]
        allotmentRef.current?.resize(next)
      }
    }
    sizesRef.current = next
    const [l, , r] = next
    if (l !== undefined) setLiveLeft(l)
    if (r !== undefined) setLiveRight(r)
    if (animatingRef.current) return
    setLayout((p) => ({
      ...p,
      leftWidth: l !== undefined && l > 0 ? l : p.leftWidth,
      rightWidth: r !== undefined && r > 0 ? r : p.rightWidth,
      leftVisible: l === undefined ? p.leftVisible : l > 0,
      rightVisible: r === undefined ? p.rightVisible : r > 0
    }))
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <TopBar
        leftCollapsed={liveLeft === 0}
        rightCollapsed={liveRight === 0}
        leftWidth={liveLeft}
        rightWidth={liveRight}
        onExpandLeft={expandLeft}
        onExpandRight={expandRight}
      />
      <div className="flex min-h-0 flex-1 px-2 pt-1 pb-2">
        <Allotment
          ref={allotmentRef}
          proportionalLayout={false}
          separator={false}
          onChange={handleChange}
          defaultSizes={sizesRef.current}
        >
          <Allotment.Pane minSize={0} maxSize={LEFT_MAX} preferredSize={LEFT_DEFAULT} snap>
            <div className="h-full overflow-hidden pr-1.5">
              <LeftSidebar onCollapse={collapseLeft} />
            </div>
          </Allotment.Pane>
          <Allotment.Pane priority={LayoutPriority.High}>
            <main className="h-full min-w-0 overflow-hidden rounded-lg bg-surface">
              <div ref={scrollRef} className="scroll-hide h-full overflow-y-auto">
                <Outlet />
              </div>
            </main>
          </Allotment.Pane>
          <Allotment.Pane minSize={0} maxSize={RIGHT_MAX} preferredSize={RIGHT_DEFAULT} snap>
            <div className="h-full overflow-hidden pl-1.5">
              <RightSidebar onCollapse={collapseRight} />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  )
}
