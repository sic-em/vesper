const KEY_SOUND_MUTED = 'vesper.notif.sound.muted'

export function readNotifSoundEnabled(): boolean {
  return localStorage.getItem(KEY_SOUND_MUTED) !== '1'
}

export function writeNotifSoundEnabled(enabled: boolean): void {
  if (enabled) localStorage.removeItem(KEY_SOUND_MUTED)
  else localStorage.setItem(KEY_SOUND_MUTED, '1')
}
