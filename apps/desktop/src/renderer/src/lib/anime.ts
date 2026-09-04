import type { TmdbGenre } from './tmdb'

const TMDB_ANIMATION_GENRE_ID = 16

/**
 * Detected anime (CONTEXT.md): Japanese original language + Animation genre, both already on
 * the TMDB detail payload. Deliberately conservative — it misses anime-adjacent shows rather
 * than running the upscaler's CNNs on live action.
 */
export function isDetectedAnime(
  details: { original_language?: string; genres?: TmdbGenre[] } | null | undefined
): boolean {
  if (!details || details.original_language !== 'ja') return false
  return (details.genres ?? []).some((g) => g.id === TMDB_ANIMATION_GENRE_ID)
}
