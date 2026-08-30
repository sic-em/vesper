const OS_BASE = 'https://opensubtitles-v3.strem.io'

export interface Subtitle {
  id: string
  url: string
  lang: string
  langName?: string
}

interface RawSub {
  id: string
  url: string
  lang: string
  SubLanguageID?: string
  SubFileName?: string
}

function buildPath(args: {
  type: 'movie' | 'series'
  imdbId: string
  season?: number
  episode?: number
  videoHash?: string
  videoSize?: number
}): string {
  const idPart =
    args.type === 'series' && args.season !== undefined && args.episode !== undefined
      ? `${args.imdbId}:${args.season}:${args.episode}`
      : args.imdbId
  const extras: string[] = []
  if (args.videoHash) extras.push(`videoHash=${args.videoHash}`)
  if (args.videoSize) extras.push(`videoSize=${args.videoSize}`)
  const extra = extras.length > 0 ? `/${extras.join('&')}` : ''
  return `/subtitles/${args.type}/${encodeURIComponent(idPart)}${extra}.json`
}

export async function fetchSubtitles(args: {
  type: 'movie' | 'series'
  imdbId: string
  season?: number
  episode?: number
  videoHash?: string
  videoSize?: number
}): Promise<Subtitle[]> {
  const url = OS_BASE + buildPath(args)
  const r = await fetch(url)
  if (!r.ok) return []
  const body = (await r.json()) as { subtitles?: RawSub[] }
  return (body.subtitles ?? []).map((s) => ({
    id: s.id,
    url: s.url,
    lang: (s.SubLanguageID ?? s.lang ?? 'unknown').toLowerCase(),
    langName: s.SubFileName
  }))
}
