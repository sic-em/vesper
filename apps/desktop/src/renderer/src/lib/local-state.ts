const PREFIX = 'vesper.'

export function getLocalStateSize(): number {
  if (typeof window === 'undefined') return 0
  let total = 0
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (!k || !k.startsWith(PREFIX)) continue
    const v = window.localStorage.getItem(k) ?? ''
    total += (k.length + v.length) * 2
  }
  return total
}

export function clearLocalState(): void {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  for (const k of keys) window.localStorage.removeItem(k)
}
