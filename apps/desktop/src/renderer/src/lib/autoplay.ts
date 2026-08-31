/** Countdown shown on the up-next card before the next episode rolls in. */
export const AUTOPLAY_COUNTDOWN_SEC = 12
/** How early the card appears when there is no outro marker to anchor it to. */
export const UP_NEXT_LEAD_SEC = 30

/** Where the up-next card appears, and where autoplay actually fires. */
export function autoplayMarks(args: {
  durationSec: number
  outroStartSec?: number
}): { cardAtSec: number; advanceAtSec: number } | null {
  const { durationSec, outroStartSec } = args
  if (!Number.isFinite(durationSec) || durationSec <= 0) return null
  if (outroStartSec !== undefined && outroStartSec > 0 && outroStartSec < durationSec) {
    return {
      cardAtSec: outroStartSec,
      // Credits are known to start here, so autoplay may cut into them — but never before the
      // viewer has had the countdown to say otherwise.
      advanceAtSec: Math.min(outroStartSec + AUTOPLAY_COUNTDOWN_SEC, durationSec)
    }
  }
  // No outro data: the card rides the real end of the file and nothing is cut short.
  return {
    cardAtSec: Math.max(durationSec * 0.9, durationSec - UP_NEXT_LEAD_SEC),
    advanceAtSec: durationSec
  }
}

// "Still watching?" gates a binge, not a session: the count is how many episodes have rolled over
// on their own since the last deliberate input. Module state rather than a ref, because the player
// remounts between episodes and the chain has to outlive that.
let chain: { key: string; count: number } | null = null

export function autoChainCount(key: string): number {
  return chain && chain.key === key ? chain.count : 0
}

export function noteAutoAdvance(key: string): void {
  chain = chain?.key === key ? { key, count: chain.count + 1 } : { key, count: 1 }
}

export function resetAutoChain(): void {
  chain = null
}

/**
 * How many episodes may roll over untouched before asking. Shorter episodes get one more, so the
 * question lands after a comparable stretch of unattended playback either way — a 50-minute drama
 * asks on the third boundary, a 20-minute comedy on the fourth.
 */
export function autoAdvancesBeforePrompt(runtimeSec: number): number {
  const minutes = runtimeSec / 60
  if (minutes >= 40) return 2
  if (minutes >= 15) return 3
  return 4
}
