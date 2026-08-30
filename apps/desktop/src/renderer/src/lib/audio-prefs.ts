const KEY_LAST_LANG = 'vesper.audio.lastLang'

export function readAudioLastLang(): string | null {
  return localStorage.getItem(KEY_LAST_LANG)
}

export function writeAudioLastLang(lang: string | null): void {
  if (lang === null) localStorage.removeItem(KEY_LAST_LANG)
  else localStorage.setItem(KEY_LAST_LANG, lang)
}
