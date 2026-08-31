import { AnimatePresence, m as motion } from 'motion/react'
import { SQUIRCLE_CLIP } from '@renderer/lib/squircle'
import { CloseIcon } from '@renderer/components/icons'

export type UpNextMode = 'countdown' | 'still-watching'

interface Props {
  visible: boolean
  mode: UpNextMode
  label: string
  stillUrl?: string | null
  secondsLeft: number
  loading: boolean
  onPlay: () => void
  onDismiss: () => void
}

/**
 * Credits-time card: rolls into the next episode on a countdown, or — once a binge has advanced
 * itself far enough without anyone touching the player — stops and asks first. In the asking mode
 * there is no countdown and nothing advances on its own; the episode simply ends.
 */
export function UpNextCard({
  visible,
  mode,
  label,
  stillUrl,
  secondsLeft,
  loading,
  onPlay,
  onDismiss
}: Props): React.JSX.Element {
  const asking = mode === 'still-watching'
  const heading = asking ? 'Still watching?' : 'Up next'
  const action = loading ? 'Starting…' : asking ? 'Continue' : 'Play now'

  return (
    <div className="pointer-events-none absolute right-8 bottom-28 z-40">
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto w-[320px]"
          >
            {/* Squircle frame holding a recessed inset — same surface anatomy as the update card. */}
            <div
              className="flex flex-col rounded-[18px] border border-white/[0.06] bg-surface-2 p-1 shadow-[0_16px_48px_rgba(0,0,0,0.55)] [--card-clip-handle:2px] [--card-clip-radius:10px] [clip-path:var(--card-clip-path)] [corner-shape:squircle]"
              style={{ '--card-clip-path': SQUIRCLE_CLIP } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-2 pt-1 pb-1.5 pr-1 pl-2">
                <h3 className="text-[13px] leading-4 font-medium text-text">{heading}</h3>
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label={asking ? 'Dismiss' : 'Cancel autoplay'}
                  className="-my-1 flex size-6 flex-shrink-0 items-center justify-center rounded-full text-text-tertiary outline-none transition-colors hover:bg-white/5 hover:text-text"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-surface p-2 [--card-clip-radius:8px] [clip-path:var(--card-clip-path)] [corner-shape:squircle]">
                {stillUrl ? (
                  <img
                    src={stillUrl}
                    alt=""
                    className="h-[46px] w-[82px] flex-shrink-0 rounded-[8px] object-cover"
                  />
                ) : null}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[12px] leading-4 font-medium text-text-secondary">
                    {label}
                  </span>
                  <span className="text-[12px] leading-4 text-text-tertiary">
                    {asking
                      ? 'Playback stopped to check in.'
                      : secondsLeft > 0
                        ? `Starting in ${secondsLeft}s`
                        : 'Starting…'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onPlay}
                disabled={loading}
                className="mx-0.5 mt-1.5 mb-0.5 flex h-9 items-center justify-center gap-1 rounded-full bg-white/10 text-[12px] font-medium text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-white/[0.16] active:scale-[0.96] disabled:opacity-60"
              >
                {action}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
