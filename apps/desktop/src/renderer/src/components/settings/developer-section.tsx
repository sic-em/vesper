import { useState } from 'react'
import { Switch } from '@renderer/components/ui/switch'
import { readDevModeEnabled, writeDevModeEnabled } from '@renderer/lib/developer-prefs'
import { isMac } from '@renderer/lib/platform'

export function DeveloperSection(): React.JSX.Element {
  const [devMode, setDevMode] = useState(() => readDevModeEnabled())

  const shortcut = isMac ? '⌘⌥I' : 'F12 or Ctrl+Shift+I'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[13px] leading-4 font-medium text-text">
            Developer mode
          </span>
          <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
            Open DevTools with {shortcut} to inspect the app and view logs.
          </span>
        </div>
        <Switch
          checked={devMode}
          onCheckedChange={(v) => {
            setDevMode(v)
            writeDevModeEnabled(v)
          }}
        />
      </div>
    </div>
  )
}
