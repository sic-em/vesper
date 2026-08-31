const KEY_LAST_LANG = 'vesper.audio.lastLang'

export function readAudioLastLang(): string | null {
  return localStorage.getItem(KEY_LAST_LANG)
}

export function writeAudioLastLang(lang: string | null): void {
  if (lang === null) localStorage.removeItem(KEY_LAST_LANG)
  else localStorage.setItem(KEY_LAST_LANG, lang)
}

// Settings shows English as the audio default, so an unset preference means English rather
// than no preference — otherwise playback falls through to whatever track the file lists
// first, which on a multi-language remux is routinely not English.
export function readAudioPreferredLang(): string {
  return readAudioLastLang() ?? 'en'
}
