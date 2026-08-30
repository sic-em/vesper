import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, m as motion, useMotionValue, useTransform } from 'motion/react'
import { cn } from '@renderer/lib/cn'

interface DialSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  className?: string
}

const HASH_COUNT = 9
const CLICK_THRESHOLD = 3

export function DialSlider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className
}: DialSliderProps): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null)
  const downPosRef = useRef<{ x: number; y: number } | null>(null)
  const isClickRef = useRef(true)
  const rectRef = useRef<DOMRect | null>(null)
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const [active, setActive] = useState(false)
  const [hover, setHover] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100
  const fillPercent = useMotionValue(percentage)
  const fillWidth = useTransform(fillPercent, (p) => `${p}%`)
  const handleLeft = useTransform(fillPercent, (p) => `max(5px, calc(${p}% - 1px))`)

  useEffect(() => {
    if (!active && !animRef.current) fillPercent.jump(percentage)
  }, [percentage, active, fillPercent])

  const round = useCallback(
    (v: number) => {
      const r = Math.round(v / step) * step
      const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
      return Number(r.toFixed(decimals))
    },
    [step]
  )

  const positionToValue = useCallback(
    (clientX: number): number => {
      const rect = rectRef.current
      if (!rect) return value
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return min + pct * (max - min)
    },
    [min, max, value]
  )

  const handlePointerDown = (e: React.PointerEvent): void => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    downPosRef.current = { x: e.clientX, y: e.clientY }
    isClickRef.current = true
    setActive(true)
    rectRef.current = trackRef.current?.getBoundingClientRect() ?? null
  }

  const handlePointerMove = (e: React.PointerEvent): void => {
    if (!active || !downPosRef.current) return
    const dx = e.clientX - downPosRef.current.x
    const dy = e.clientY - downPosRef.current.y
    if (isClickRef.current && Math.hypot(dx, dy) > CLICK_THRESHOLD) {
      isClickRef.current = false
    }
    if (!isClickRef.current) {
      const v = positionToValue(e.clientX)
      const pct = ((v - min) / (max - min)) * 100
      animRef.current?.stop()
      animRef.current = null
      fillPercent.jump(pct)
      onChange(round(v))
    }
  }

  const handlePointerUp = (e: React.PointerEvent): void => {
    if (!active) return
    if (isClickRef.current) {
      const v = positionToValue(e.clientX)
      const pct = ((v - min) / (max - min)) * 100
      animRef.current?.stop()
      animRef.current = animate(fillPercent, pct, {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        onComplete: () => {
          animRef.current = null
        }
      })
      onChange(round(v))
    }
    setActive(false)
    downPosRef.current = null
  }

  const isActive = active || hover
  const display = step < 1 ? value.toFixed(Math.ceil(-Math.log10(step))) : value.toFixed(0)

  return (
    <div className={cn('relative h-9 w-full', className)}>
      <motion.div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className={cn(
          'relative h-full w-full overflow-hidden rounded-md bg-surface-3 select-none',
          active ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ touchAction: 'none' }}
      >
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: HASH_COUNT }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200',
                isActive ? 'bg-white/20' : 'bg-transparent'
              )}
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
        <motion.div
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 transition-colors duration-150',
            isActive ? 'bg-white/20' : 'bg-white/10'
          )}
          style={{ width: fillWidth }}
        />
        <motion.div
          className="pointer-events-none absolute top-1/2 h-5 w-[3px] rounded-full bg-white"
          style={{ left: handleLeft, y: '-50%' }}
          animate={{
            opacity: isActive ? (active ? 0.9 : 0.5) : 0,
            scaleX: isActive ? 1 : 0.25
          }}
          transition={{
            scaleX: { type: 'spring', visualDuration: 0.25, bounce: 0.15 },
            opacity: { duration: 0.15 }
          }}
        />
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] font-medium text-text-tertiary">
          {label}
        </span>
        <span
          className={cn(
            'pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[13px] font-medium transition-colors',
            isActive ? 'text-text' : 'text-text-tertiary'
          )}
        >
          {display}
        </span>
      </motion.div>
    </div>
  )
}
