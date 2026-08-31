import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { latestEntry } from '@vesper/changelog'
import { SQUIRCLE_CLIP } from '@renderer/lib/squircle'

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
      {/* Squircle frame holding a recessed inset — same surface anatomy as the feedback modal. */}
      <div
        className="flex flex-col rounded-[18px] border border-white/[0.06] bg-surface-2 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.3)] [--card-clip-handle:2px] [--card-clip-radius:10px] [clip-path:var(--card-clip-path)] [corner-shape:squircle]"
        style={{ '--card-clip-path': SQUIRCLE_CLIP } as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-2 pt-1 pb-1.5 pl-2 pr-1">
          <h3 className="text-[13px] leading-4 font-medium text-text">
            What&apos;s new in v{entry.version}
          </h3>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="-my-1 flex size-6 flex-shrink-0 items-center justify-center rounded-full text-text-tertiary outline-none transition-colors hover:bg-white/5 hover:text-text"
          >
            <span aria-hidden className="inline-block h-[2px] w-3.5 rounded-full bg-current" />
          </button>
        </div>
        <div className="rounded-[14px] border border-white/[0.05] bg-surface px-2.5 py-2 [--card-clip-radius:8px] [clip-path:var(--card-clip-path)] [corner-shape:squircle]">
          <p className="text-[12px] leading-4 text-text-secondary">{entry.summary}</p>
        </div>
        <Link
          to="/changelog"
          onClick={() => {
            localStorage.setItem(LAST_SEEN_KEY, entry.version)
          }}
          className="mx-0.5 mt-1.5 mb-0.5 flex h-9 items-center justify-center gap-1 rounded-full bg-white/10 text-[12px] font-medium text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-white/[0.16] active:scale-[0.96]"
        >
          See what changed
          <ChevronRight />
        </Link>
      </div>
    </div>
  )
}
