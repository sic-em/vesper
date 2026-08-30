const BASE = 'https://api.introdb.app'

export interface IntroDbSegment {
  start_sec: number
  end_sec: number
  confidence: number
  submission_count: number
}

export interface IntroDbResponse {
  imdb_id: string
  season: number
  episode: number
  intro: IntroDbSegment | null
  recap: IntroDbSegment | null
  outro: IntroDbSegment | null
}

export async function fetchSegments(args: {
  imdbId: string
  season: number
  episode: number
}): Promise<IntroDbResponse> {
  const u = new URL(`${BASE}/segments`)
  u.searchParams.set('imdb_id', args.imdbId)
  u.searchParams.set('season', String(args.season))
  u.searchParams.set('episode', String(args.episode))
  const r = await fetch(u.toString())
  if (!r.ok) throw new Error(`introdb ${r.status}`)
  return (await r.json()) as IntroDbResponse
}

export function segmentsQuery(args: { imdbId?: string; season?: number; episode?: number }): {
  queryKey: readonly unknown[]
  queryFn: () => Promise<IntroDbResponse>
  enabled: boolean
  staleTime: number
  gcTime: number
} {
  return {
    queryKey: ['introdb-segments', args.imdbId, args.season, args.episode] as const,
    queryFn: () =>
      fetchSegments({ imdbId: args.imdbId!, season: args.season!, episode: args.episode! }),
    enabled: !!args.imdbId && !!args.season && !!args.episode,
    staleTime: 60 * 60_000,
    gcTime: 24 * 60 * 60_000
  }
}
