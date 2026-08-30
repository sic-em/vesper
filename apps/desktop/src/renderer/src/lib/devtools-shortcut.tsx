import { useEffect } from 'react'
import { isMac } from '@renderer/lib/platform'
import { readDevModeEnabled } from '@renderer/lib/developer-prefs'

export function DevtoolsShortcut(): null {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const inspectCombo = isMac
        ? e.metaKey && e.altKey && e.key.toLowerCase() === 'i'
        : e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i'
      if (e.key !== 'F12' && !inspectCombo) return
      if (!readDevModeEnabled()) return
      e.preventDefault()
      void window.api.devtools.toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return null
}
