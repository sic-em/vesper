import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BorderBeam } from 'border-beam'
import { latestEntry } from '@vesper/changelog'

const LAST_SEEN_KEY = 'vesper:lastSeenChangelogVersion'

function ChevronRight(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
      <path
        d="M10 16L13.2929 12.7071C13.6834 12.3166 13.6834 11.6834 13.2929 11.2929L10 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UpdateCard(): React.JSX.Element | null {
  const entry = latestEntry()
  const [dismissed, setDismissed] = useState(() => {
    if (!entry || typeof localStorage === 'undefined') return true
    return localStorage.getItem(LAST_SEEN_KEY) === entry.version
  })

  if (!entry || dismissed) return null

  const dismiss = (): void => {
    localStorage.setItem(LAST_SEEN_KEY, entry.version)
    setDismissed(true)
  }

  return (
    <div className="mx-2 mb-2">
      <BorderBeam size="md" colorVariant="mono" theme="dark" strength={0.7}>
        <div className="relative overflow-hidden rounded-xl border border-white/8 bg-elevated p-3.5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")`
            }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <h3 className="text-[13px] leading-4 font-semibold text-text">
              What&apos;s new in v{entry.version}
            </h3>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="-my-1 flex size-6 flex-shrink-0 items-center justify-center rounded-md text-text-tertiary outline-none transition-colors hover:bg-white/5 hover:text-text"
            >
              <span aria-hidden className="inline-block h-[2px] w-3.5 rounded-full bg-current" />
            </button>
          </div>
          <p className="relative mt-1.5 text-[12px] leading-4 text-text-secondary">
            TV shows now open on season 1 instead of the latest season.
          </p>
          <Link
            to="/changelog"
            onClick={() => {
              localStorage.setItem(LAST_SEEN_KEY, entry.version)
            }}
            className="relative mt-3 flex h-9 items-center justify-center gap-1 rounded-full bg-white/10 text-[12px] font-semibold text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-white/[0.16] active:scale-[0.96]"
          >
            See what changed
            <ChevronRight />
          </Link>
        </div>
      </BorderBeam>
    </div>
  )
}
