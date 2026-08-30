import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Switch } from '@renderer/components/ui/switch'
import { Select } from '@renderer/components/ui/select'
import { CheckIcon } from '@renderer/components/icons'
import { cn } from '@renderer/lib/cn'
import { api } from '@convex/_generated/api'

type Visibility = 'public' | 'friends' | 'hidden'
type ListVisibility = 'private' | 'public'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'hidden', label: 'Hidden' }
]

const LIST_VIS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' }
]

export function PrivacySection(): React.JSX.Element {
  const privacy = useQuery(api.profiles.getPrivacy)
  const update = useMutation(api.profiles.updatePrivacy)
  const clearWatch = useMutation(api.playback.clearWatchHistory)
  const clearSearch = useMutation(api.search.clearSearchHistory)

  if (privacy === undefined) {
    return <div className="h-32 animate-pulse rounded-lg bg-white/[0.02]" />
  }
  if (privacy === null) {
    return <p className="text-[12px] text-text-muted">Sign in to manage privacy.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <ToggleRow
        title="Appear offline"
        description="Friends see you as offline regardless of whether you're using Vesper."
        checked={privacy.hidePresence}
        onChange={(v) => void update({ hidePresence: v })}
      />
      <ToggleRow
        title="Hide watching activity"
        description="Stay visible but don't broadcast what you're watching."
        checked={privacy.hideActivity}
        onChange={(v) => void update({ hideActivity: v })}
      />
      <SelectRow
        title="Profile visibility"
        description="Controls who can view your profile page and see your watch activity."
        value={privacy.visibility}
        options={VISIBILITY_OPTIONS}
        onChange={(v) => void update({ visibility: v as Visibility })}
      />
      <SelectRow
        title="Default list visibility"
        description="Initial visibility for new lists you create."
        value={privacy.defaultListVisibility}
        options={LIST_VIS_OPTIONS}
        onChange={(v) => void update({ defaultListVisibility: v as ListVisibility })}
      />
      <DestructiveRow
        title="Clear watch history"
        description="Removes all playback progress across every title."
        onConfirm={async () => {
          await clearWatch()
        }}
      />
      <DestructiveRow
        title="Clear search history"
        description="Removes everything from your recent searches list."
        onConfirm={async () => {
          await clearSearch()
        }}
      />
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] leading-4 font-medium text-text">{title}</span>
        <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
          {description}
        </span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SelectRow({
  title,
  description,
  value,
  options,
  onChange
}: {
  title: string
  description: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] leading-4 font-medium text-text">{title}</span>
        <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
          {description}
        </span>
      </div>
      <Select value={value} onChange={onChange} options={options} ariaLabel={title} />
    </div>
  )
}

function DestructiveRow({
  title,
  description,
  onConfirm
}: {
  title: string
  description: string
  onConfirm: () => Promise<void>
}): React.JSX.Element {
  const [confirm, setConfirm] = useState(false)
  const [cleared, setCleared] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      if (clearedTimer.current) clearTimeout(clearedTimer.current)
    }
  }, [])

  const onClick = async (): Promise<void> => {
    if (!confirm) {
      setConfirm(true)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirm(false), 3000)
      return
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    setConfirm(false)
    await onConfirm()
    setCleared(true)
    if (clearedTimer.current) clearTimeout(clearedTimer.current)
    clearedTimer.current = setTimeout(() => setCleared(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] leading-4 font-medium text-text">{title}</span>
        <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
          {description}
        </span>
      </div>
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
        aria-label={confirm ? 'Confirm clear' : title}
      >
        {cleared ? <CheckIcon className="size-3.5" /> : confirm ? 'Confirm?' : 'Clear'}
      </button>
    </div>
  )
}
