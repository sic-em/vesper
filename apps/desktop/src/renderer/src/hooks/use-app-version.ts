import { useEffect, useState } from 'react'

/** The running app's version, or null until the main process answers. */
export function useAppVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void window.api
      .getAppVersion()
      .then((v) => {
        if (alive) setVersion(v)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return version
}
