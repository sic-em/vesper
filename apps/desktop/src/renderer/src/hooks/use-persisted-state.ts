import { useCallback, useEffect, useRef, useState } from 'react'

type Setter<T> = (value: T | ((prev: T) => T)) => void

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function usePersistedState<T>(key: string, initial: T): [T, Setter<T>] {
  const [value, setValue] = useState<T>(() => read(key, initial))
  const keyRef = useRef(key)
  keyRef.current = key

  const set = useCallback<Setter<T>>((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(resolved))
      } catch {
        // quota / private mode — drop silently
      }
      return resolved
    })
  }, [])

  // sync across windows (storage event)
  useEffect(() => {
    const handler = (e: StorageEvent): void => {
      if (e.key !== keyRef.current || e.newValue === null) return
      try {
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        // ignore corrupt
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return [value, set]
}
