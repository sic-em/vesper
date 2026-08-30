const KEY_DEV_MODE = 'vesper.developer.mode'

export function readDevModeEnabled(): boolean {
  return localStorage.getItem(KEY_DEV_MODE) === '1'
}

export function writeDevModeEnabled(enabled: boolean): void {
  if (enabled) localStorage.setItem(KEY_DEV_MODE, '1')
  else localStorage.removeItem(KEY_DEV_MODE)
}
