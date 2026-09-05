import { queryOptions } from '@tanstack/react-query'
import type { FightMatch } from './api'

// UFC fight cards come from ESPN's unofficial public API (no key, CORS *).
// One fightcenter call carries the whole card; only the per-fighter career
// stats need extra requests, fetched lazily per expanded bout.

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc'
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc'
const CORE = 'https://sports.core.api.espn.com/v2/sports/mma'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`espn ${res.status}`)
  return (await res.json()) as T
}

export interface EspnEvent {
  id: string
  name: string
  shortName?: string
  date: string
  status?: { type?: { state?: 'pre' | 'in' | 'post' } }
}

interface Scoreboard {
  events?: EspnEvent[]
}

function ymd(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${d.getFullYear()}${m < 10 ? `0${m}` : m}${day < 10 ? `0${day}` : day}`
}

/** Scoreboard covering the match's day ±1 (time zones shift calendar days). */
export const ufcScoreboardQuery = (aroundMs: number) => {
  const center = Number.isFinite(aroundMs) && aroundMs > 0 ? aroundMs : Date.now()
  const from = ymd(new Date(center - 86_400_000))
  const to = ymd(new Date(center + 86_400_000))
  return queryOptions({
    queryKey: ['espn', 'ufc-scoreboard', from, to],
    queryFn: async () => {
      const sb = await getJson<Scoreboard>(`${SITE}/scoreboard?dates=${from}-${to}`)
      return sb.events ?? []
    },
    staleTime: 5 * 60_000
  })
}

function surnames(title: string): [string, string] | null {
  const parts = title.split(/\bvs\.?\b/i)
  if (parts.length < 2) return null
  const left = parts[0].trim().split(/\s+/).pop()
  const right = parts[1].trim().split(/\s+/)[0]
  if (!left || !right) return null
  return [left.toLowerCase(), right.toLowerCase()]
}

/**
 * Map a fight title like "UFC Fight Night 287 Hooker vs Parnasse" to an ESPN
 * event. ESPN never numbers Fight Nights, so the main-event surnames are the
 * signal there; numbered PPVs match on the number itself.
 */
export function matchEspnEvent(match: FightMatch, events: EspnEvent[]): EspnEvent | null {
  const title = match.title.toLowerCase()

  const ppv = title.match(/\bufc\s+(\d{2,3})\b/)
  if (ppv) {
    const hit = events.find((e) => new RegExp(`\\bufc\\s+${ppv[1]}\\b`).test(e.name.toLowerCase()))
    if (hit) return hit
  }

  const names = surnames(match.title)
  if (names) {
    const hit = events.find((e) => {
      const n = e.name.toLowerCase()
      return n.includes(names[0]) && n.includes(names[1])
    })
    if (hit) return hit
  }

  if (title.includes('contender series')) {
    return events.find((e) => e.name.toLowerCase().includes('contender series')) ?? null
  }

  return null
}

// ---- fight card (fightcenter v3) ----

export interface EspnAthlete {
  id?: string
  displayName: string
  displayHeight?: string
  displayWeight?: string
  displayReach?: string
  age?: number
  stance?: { text?: string }
  flag?: { href?: string; alt?: string }
  headshot?: { href?: string }
  country?: string
  images?: Array<{ href?: string; rel?: string[] }>
}

/**
 * Full-body stance pose. `facing` is the direction the fighter should look
 * (toward the opponent); falls back to whichever side ESPN has.
 */
export function stanceImage(
  athlete: EspnAthlete | undefined,
  facing: 'left' | 'right'
): string | undefined {
  const images = athlete?.images ?? []
  const preferred = images.find((i) => i.rel?.includes(`${facing}Stance`))?.href
  return preferred ?? images.find((i) => i.href)?.href
}

export interface EspnCompetitor {
  id?: string
  winner?: boolean
  displayRecord?: string
  order?: number
  athlete?: EspnAthlete
}

export interface EspnBoutStatus {
  period?: number
  displayClock?: string
  type?: { state?: 'pre' | 'in' | 'post'; completed?: boolean }
  result?: { displayName?: string; description?: string }
}

export interface EspnBout {
  id: string
  type?: { text?: string }
  matchNumber?: number
  note?: string
  status?: EspnBoutStatus
  competitors?: EspnCompetitor[]
}

export interface EspnCard {
  name?: string
  displayName?: string
  competitions?: EspnBout[]
  broadcasts?: Array<{ slug?: string; media?: { shortName?: string; callLetters?: string } }>
}

export interface FightCenter {
  event?: { id: string; name: string; date: string }
  cards?: Record<string, EspnCard>
}

export const fightCenterQuery = (eventId: string, live: boolean) =>
  queryOptions({
    queryKey: ['espn', 'fightcenter', eventId],
    queryFn: () => getJson<FightCenter>(`${WEB}/fightcenter/${eventId}?region=us&lang=en`),
    staleTime: live ? 20_000 : 5 * 60_000,
    refetchInterval: live ? 30_000 : false
  })

/** Segment order on the page: main card first, then prelims, then early prelims. */
export const CARD_SEGMENT_ORDER = ['main', 'prelims1', 'prelims2']

// ---- career stats (tale of the tape) ----

interface CoreStats {
  splits?: { categories?: Array<{ stats?: Array<{ name?: string; displayValue?: string }> }> }
}

export const athleteStatsQuery = (athleteId: string) =>
  queryOptions({
    queryKey: ['espn', 'athlete-stats', athleteId],
    queryFn: async () => {
      const data = await getJson<CoreStats>(`${CORE}/athletes/${athleteId}/statistics`)
      const out: Record<string, string> = {}
      for (const cat of data.splits?.categories ?? []) {
        for (const stat of cat.stats ?? []) {
          if (stat.name && stat.displayValue !== undefined) out[stat.name] = stat.displayValue
        }
      }
      return out
    },
    staleTime: 24 * 60 * 60_000,
    retry: 1
  })
