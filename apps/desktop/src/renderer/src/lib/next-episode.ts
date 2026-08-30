import type { Doc } from '@convex/_generated/dataModel'

export interface EpisodeRef {
  season: number
  episode: number
}

export interface SeriesEpisodeList {
  // ordered by season ascending, then episode ascending
  episodes: EpisodeRef[]
}

const COMPLETE = 0.95

function isComplete(p: Doc<'playbackProgress'>): boolean {
  if (p.durationSec <= 0) return false
  return p.positionSec / p.durationSec >= COMPLETE
}

function epIndex(list: SeriesEpisodeList, season: number, episode: number): number {
  return list.episodes.findIndex((e) => e.season === season && e.episode === episode)
}

export interface NextEpisodeResult {
  ref: EpisodeRef
  resumeSec?: number
  state: 'fresh' | 'resume' | 'next'
}

export function chooseNextEpisode(args: {
  progress: Doc<'playbackProgress'>[]
  episodes: EpisodeRef[]
}): NextEpisodeResult | null {
  const { progress, episodes } = args
  if (episodes.length === 0) return null

  const list: SeriesEpisodeList = { episodes }
  const episodeProgress = progress.filter((p) => p.season !== undefined && p.episode !== undefined)

  if (episodeProgress.length === 0) {
    return { ref: episodes[0]!, state: 'fresh' }
  }

  const latest = episodeProgress.toSorted((a, b) => b.updatedAt - a.updatedAt)[0]!

  if (!isComplete(latest)) {
    return {
      ref: { season: latest.season!, episode: latest.episode! },
      resumeSec: latest.positionSec,
      state: 'resume'
    }
  }

  const idx = epIndex(list, latest.season!, latest.episode!)
  if (idx >= 0 && idx + 1 < episodes.length) {
    return { ref: episodes[idx + 1]!, state: 'next' }
  }
  // last episode completed — fall back to first
  return { ref: episodes[0]!, state: 'fresh' }
}

export function formatTimeLeft(positionSec: number, durationSec: number): string {
  const remaining = Math.max(0, durationSec - positionSec)
  if (remaining < 60) return `${Math.round(remaining)}s left`
  const minutes = Math.round(remaining / 60)
  if (minutes < 60) return `${minutes}m left`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`
}
