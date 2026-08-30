import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearQueryCache, getQueryCacheSize } from '@renderer/lib/query-persister'
import { clearLocalState, getLocalStateSize } from '@renderer/lib/local-state'
import { CheckIcon } from '@renderer/components/icons'
import { Select } from '@renderer/components/ui/select'
import { cn } from '@renderer/lib/cn'

const GB = 1024 * 1024 * 1024
const CACHE_LIMIT_OPTIONS = [
  { value: String(4 * GB), label: '4 GB' },
  { value: String(8 * GB), label: '8 GB' },
  { value: String(16 * GB), label: '16 GB' },
  { value: String(32 * GB), label: '32 GB' },
  { value: String(64 * GB), label: '64 GB' }
]

interface Bucket {
  id: 'queries' | 'images' | 'state'
  title: string
  description: string
  getSize: () => Promise<number> | number
  clear: () => Promise<void> | void
}

export function StorageSection(): React.JSX.Element {
  const qc = useQueryClient()

  const buckets: Bucket[] = [
    {
      id: 'queries',
      title: 'Query cache',
      description: 'TMDB, ratings, and external metadata persisted between launches.',
      getSize: getQueryCacheSize,
      clear: async () => {
        await clearQueryCache()
        qc.clear()
      }
    },
    {
      id: 'images',
      title: 'Image cache',
      description: 'Posters, backdrops, logos, and other downloaded assets.',
      getSize: () => window.api.storage.imageCacheSize(),
      clear: () => window.api.storage.clearImageCache()
    },
    {
      id: 'state',
      title: 'User preferences',
      description: 'Subtitle styling, audio language, and other local settings.',
      getSize: () => getLocalStateSize(),
      clear: () => clearLocalState()
    }
  ]

  return (
    <div className="flex flex-col gap-2">
      <CacheLimitRow />
      {buckets.map((b) => (
        <StorageRow key={b.id} bucket={b} />
      ))}
    </div>
  )
}

function CacheLimitRow(): React.JSX.Element {
  const [applied, setApplied] = useState<number | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api.storage.getCacheLimit().then((r) => {
      if (cancelled) return
      setApplied(r.applied)
      setPending(r.pending)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = pending !== null ? String(pending) : ''
  const restartHint = applied !== null && pending !== null && applied !== pending

  const onChange = async (next: string): Promise<void> => {
    const n = parseInt(next, 10)
    if (!Number.isFinite(n)) return
    setPending(n)
    await window.api.storage.setCacheLimit(n)
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] leading-4 font-medium text-text">
          Maximum image cache size
        </span>
        <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
          Oldest assets are evicted automatically once the limit is reached.
        </span>
      </div>
      {restartHint ? (
        <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-1 text-[11px] leading-3 font-medium text-amber-400">
          Applies on restart
        </span>
      ) : null}
      <Select
        value={value}
        onChange={(v) => void onChange(v)}
        options={CACHE_LIMIT_OPTIONS}
        ariaLabel="Maximum image cache size"
      />
    </div>
  )
}

function StorageRow({ bucket }: { bucket: Bucket }): React.JSX.Element {
  const [size, setSize] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [cleared, setCleared] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const n = await bucket.getSize()
      setSize(n)
    } catch {
      setSize(0)
    }
  }, [bucket])

  useEffect(() => {
    void refresh()
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      if (clearedTimer.current) clearTimeout(clearedTimer.current)
    }
  }, [refresh])

  const onClick = async (): Promise<void> => {
    if (!confirm) {
      setConfirm(true)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirm(false), 3000)
      return
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    setConfirm(false)
    await bucket.clear()
    await refresh()
    setCleared(true)
    if (clearedTimer.current) clearTimeout(clearedTimer.current)
    clearedTimer.current = setTimeout(() => setCleared(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] leading-4 font-medium text-text">{bucket.title}</span>
        <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
          {bucket.description}
        </span>
      </div>
      <span className="shrink-0 text-[12px] leading-4 font-medium tabular-nums text-text-tertiary">
        {size === null ? '—' : formatBytes(size)}
      </span>
      <button
        type="button"
        onClick={() => void onClick()}
        className={cn(
          'relative flex h-7 shrink-0 items-center justify-center rounded-md px-3 text-[11px] font-medium outline-none transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
          confirm
            ? 'bg-red-500/15 text-red-400'
            : cleared
              ? 'bg-green-500/15 text-green-400'
              : 'bg-surface-3 text-text'
        )}
        aria-label={confirm ? 'Confirm clear' : `Clear ${bucket.title}`}
      >
        {cleared ? <CheckIcon className="size-3.5" /> : confirm ? 'Confirm?' : 'Clear'}
      </button>
    </div>
  )
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`
}
