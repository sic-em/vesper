import { useEffect, useState } from 'react'

interface Args {
  positionSec: number
  durationSec: number
  updatedAt: number
  state: 'playing' | 'paused' | 'idle' | undefined
}

export function useInterpolatedProgress({
  positionSec,
  durationSec,
  updatedAt,
  state
}: Args): number {
  const [pct, setPct] = useState(() => calcPct({ positionSec, durationSec, updatedAt, state }))

  useEffect(() => {
    if (state !== 'playing') {
      setPct(calcPct({ positionSec, durationSec, updatedAt, state }))
      return
    }
    let raf = 0
    const tick = (): void => {
      setPct(calcPct({ positionSec, durationSec, updatedAt, state }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [positionSec, durationSec, updatedAt, state])

  return pct
}

function calcPct({ positionSec, durationSec, updatedAt, state }: Args): number {
  if (!durationSec) return 0
  const elapsed = state === 'playing' ? (Date.now() - updatedAt) / 1000 : 0
  const current = Math.min(durationSec, positionSec + Math.max(0, elapsed))
  return Math.min(100, Math.max(0, (current / durationSec) * 100))
}
