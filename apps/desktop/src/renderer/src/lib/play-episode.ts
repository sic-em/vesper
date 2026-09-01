import { scrapeAndRace } from './stream-orchestrator'
import type { TmdbEpisode, TmdbSeasonSummary } from './tmdb'

export interface EpisodeCursor {
  season: number
  episode: number
}

/** The episode after this one, crossing into the next season once a season runs out. */
export function nextEpisodeCursor(args: {
  current: EpisodeCursor
  episodesInSeason: number
  seasons: TmdbSeasonSummary[]
}): EpisodeCursor | null {
  const { current, episodesInSeason, seasons } = args
  // A season whose episode list has not loaded yet is unknown, not empty — reading it as empty
  // would answer "next season, episode one" while the viewer is mid-season.
  if (episodesInSeason <= 0) return null
  if (current.episode < episodesInSeason) {
    return { season: current.season, episode: current.episode + 1 }
  }
  const later = seasons
    .filter((s) => s.season_number > current.season && s.episode_count > 0)
    .toSorted((a, b) => a.season_number - b.season_number)[0]
  return later ? { season: later.season_number, episode: 1 } : null
}

/** The episode before this one, stepping back into the previous season's finale at a boundary. */
export function previousEpisodeCursor(args: {
  current: EpisodeCursor
  seasons: TmdbSeasonSummary[]
}): EpisodeCursor | null {
  const { current, seasons } = args
  if (current.episode > 1) return { season: current.season, episode: current.episode - 1 }
  const earlier = seasons
    .filter((s) => s.season_number < current.season && s.episode_count > 0)
    .toSorted((a, b) => b.season_number - a.season_number)[0]
  return earlier ? { season: earlier.season_number, episode: earlier.episode_count } : null
}

/**
 * TMDB lists episodes before they air, and offering to play one is offering a stream that cannot
 * exist. An unknown air date is left playable — the scrape decides.
 */
export function hasAired(ep: TmdbEpisode | null | undefined): boolean {
  if (!ep) return false
  if (!ep.air_date) return true
  const airedAt = Date.parse(`${ep.air_date}T00:00:00Z`)
  return !Number.isFinite(airedAt) || airedAt <= Date.now()
}

/** Search params for the watch route, as an episode launch fills them in. */
export interface EpisodeWatchSearch {
  url: string
  title: string
  episodeLabel: string
  imdbId: string
  mediaType: 'tv'
  season: number
  episode: number
  filename?: string
  bingeGroup?: string
}

export function formatEpisodeLabel(season: number, episode: number, name?: string | null): string {
  const base = `S${season}E${episode}`
  return name ? `${base} · ${name}` : base
}

/**
 * Resolve a playable stream for an episode and shape it into watch-route search params. Next,
 * previous, and autoplay all go through here so they inherit binge-group continuity and dead-link
 * fallback.
 */
export async function resolveEpisodeWatch(args: {
  tvTmdbId: number
  imdbId: string
  showTitle: string
  season: number
  episode: number
  episodeName?: string | null
  bingeGroup?: string
}): Promise<EpisodeWatchSearch> {
  const { stream, url } = await scrapeAndRace({
    scrape: {
      mediaType: 'tv',
      imdbId: args.imdbId,
      tmdbId: args.tvTmdbId,
      season: args.season,
      episode: args.episode
    },
    bingeGroup: args.bingeGroup
  })
  return {
    url,
    title: args.showTitle,
    episodeLabel: formatEpisodeLabel(args.season, args.episode, args.episodeName),
    imdbId: args.imdbId,
    mediaType: 'tv',
    season: args.season,
    episode: args.episode,
    filename: stream.filename,
    bingeGroup: stream.bingeGroup
  }
}
