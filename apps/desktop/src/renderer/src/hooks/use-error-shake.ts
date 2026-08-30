import { useEffect, useRef } from 'react'

export function useErrorShake<T extends HTMLElement>(
  error: string | undefined
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    if (!error || !ref.current) return
    const el = ref.current
    el.classList.remove('is-shaking')
    void el.offsetWidth
    el.classList.add('is-shaking')
  }, [error])
  return ref
}
