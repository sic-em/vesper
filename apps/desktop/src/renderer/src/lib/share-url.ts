const WEB_HOST = 'https://vespr.dev'

export function shareUrlForMovie(tmdbId: number): string {
  return `${WEB_HOST}/movie/${tmdbId}`
}

export function shareUrlForTv(tmdbId: number): string {
  return `${WEB_HOST}/tv/${tmdbId}`
}

export function shareUrlForEpisode(tmdbId: number, season: number, episode: number): string {
  return `${WEB_HOST}/tv/${tmdbId}/s${season}e${episode}`
}

export function shareUrlForUser(username: string): string {
  return `${WEB_HOST}/user/${encodeURIComponent(username)}`
}

export function shareUrlForList(shortCode: string): string {
  return `${WEB_HOST}/list/${shortCode}`
}
