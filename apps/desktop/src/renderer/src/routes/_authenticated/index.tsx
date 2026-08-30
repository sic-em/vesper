import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery as useConvexQuery } from 'convex/react'
import { ContinueCard } from '@renderer/components/media/continue-card'
import { PosterRow, type PosterRowItem } from '@renderer/components/media/poster-row'
import { FeaturedCarousel } from '@renderer/components/media/featured-carousel'
import { ScrollSection } from '@renderer/components/ui/scroll-section'
import { formatTimeLeft } from '@renderer/lib/next-episode'
import { MediaContextMenu } from '@renderer/components/library/media-context-menu'
import { api } from '@convex/_generated/api'
import { useMutation } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import {
  trendingMoviesQuery,
  trendingAllQuery,
  topMoviesRecentQuery,
  topTvRecentQuery,
  genreMoviesQuery,
  movieDetailsQuery,
  type GenreKey
} from '@renderer/lib/tmdb-queries'
import {
  fanartMovieQuery,
  fanartTvQuery,
  imdbRatingsQuery,
  pickMovieHeroLogo,
  preloadImage,
  tvExternalIdsQuery
} from '@renderer/lib/external-queries'
import type { FanartMovie } from '@renderer/lib/fanart'
import { pickFanartLogo } from '@renderer/lib/fanart'
import {
  tmdbImage,
  trendingItemTitle,
  type TmdbMovie,
  type TmdbShow,
  type TmdbTrendingItem
} from '@renderer/lib/tmdb'

const PREFETCH_TIMEOUT_MS = 1500
const CONTINUE_COUNT = 10

const GENRE_ROWS: { key: GenreKey; title: string }[] = [
  { key: 'scifi', title: 'Sci-Fi' },
  { key: 'horror', title: 'Horror' },
  { key: 'comedy', title: 'Comedy' },
  { key: 'animation', title: 'Animation' },
  { key: 'drama', title: 'Drama' },
  { key: 'action', title: 'Action' },
  { key: 'thriller', title: 'Thriller' },
  { key: 'romance', title: 'Romance' },
  { key: 'fantasy', title: 'Fantasy' },
  { key: 'crime', title: 'Crime' },
  { key: 'mystery', title: 'Mystery' },
  { key: 'adventure', title: 'Adventure' },
  { key: 'family', title: 'Family' }
]

type ContinueRow = FunctionReturnType<typeof api.playback.listContinueWatching>[number]

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function prefetchHero(qc: QueryClient, movieId: number): Promise<void> {
  if (!movieId) return
  const details = await qc.ensureQueryData(movieDetailsQuery(movieId)).catch(() => null)
  const imdbId = details?.imdb_id ?? undefined
  if (!imdbId) return
  await Promise.race([
    Promise.all([
      qc.ensureQueryData(imdbRatingsQuery(imdbId)).catch(() => undefined),
      qc.ensureQueryData(fanartMovieQuery(imdbId)).catch(() => undefined)
    ]),
    timeout(PREFETCH_TIMEOUT_MS)
  ])
  const fanart = qc.getQueryData(fanartMovieQuery(imdbId).queryKey) as
    | FanartMovie
    | null
    | undefined
  preloadImage(pickMovieHeroLogo(details ?? undefined, fanart))
}

export const Route = createFileRoute('/_authenticated/')({
  loader: async ({ context }) => {
    const qc = context.queryClient
    const [trendingMovies] = await Promise.all([
      qc.ensureQueryData(trendingMoviesQuery()),
      qc.ensureQueryData(trendingAllQuery()),
      qc.ensureQueryData(topMoviesRecentQuery()),
      qc.ensureQueryData(topTvRecentQuery()),
      ...GENRE_ROWS.map((g) => qc.ensureQueryData(genreMoviesQuery(g.key)))
    ])

    const heroId = trendingMovies.results[0]?.id ?? 0
    await Promise.race([prefetchHero(qc, heroId), timeout(PREFETCH_TIMEOUT_MS)])
  },
  component: HomePage
})

function movieToPoster(m: TmdbMovie): PosterRowItem {
  return {
    id: m.id,
    title: m.title,
    poster: tmdbImage(m.poster_path, 'w342') ?? '',
    posterPath: m.poster_path ?? undefined,
    type: 'movie'
  }
}
function showToPoster(s: TmdbShow): PosterRowItem {
  return {
    id: s.id,
    title: s.name,
    poster: tmdbImage(s.poster_path, 'w342') ?? '',
    posterPath: s.poster_path ?? undefined,
    type: 'tv'
  }
}
function trendingToPoster(t: TmdbTrendingItem): PosterRowItem {
  return {
    id: t.id,
    title: trendingItemTitle(t),
    poster: tmdbImage(t.poster_path, 'w342') ?? '',
    posterPath: t.poster_path ?? undefined,
    type: t.media_type
  }
}

function HomePage(): React.JSX.Element {
  const trendingMovies = useSuspenseQuery(trendingMoviesQuery())
  const trendingAll = useSuspenseQuery(trendingAllQuery())
  const topMovies = useSuspenseQuery(topMoviesRecentQuery())
  const topTv = useSuspenseQuery(topTvRecentQuery())

  const featuredIds = trendingMovies.data.results.slice(0, 8).map((m) => m.id)

  return (
    <div className="flex flex-col gap-8 pb-8">
      <FeaturedCarousel movieIds={featuredIds} />

      <ContinueWatchingSection />

      <PosterRow
        title="Trending Now"
        items={trendingAll.data.results.map(trendingToPoster)}
        max={20}
      />
      <PosterRow title="Top 10 Movies" items={topMovies.data.results.map(movieToPoster)} max={10} />
      <PosterRow title="Top 10 Series" items={topTv.data.results.map(showToPoster)} max={10} />

      {GENRE_ROWS.map((g) => (
        <GenreRow key={g.key} genre={g.key} title={g.title} />
      ))}
    </div>
  )
}

function GenreRow({ genre, title }: { genre: GenreKey; title: string }): React.JSX.Element {
  const { data } = useSuspenseQuery(genreMoviesQuery(genre))
  return <PosterRow title={title} items={data.results.map(movieToPoster)} max={20} />
}

function ContinueWatchingSection(): React.JSX.Element | null {
  const rows = useConvexQuery(api.playback.listContinueWatching, { limit: CONTINUE_COUNT })
  if (!rows || rows.length === 0) return null
  return (
    <ScrollSection title="Continue Watching">
      {rows.map((row) => (
        <ContinueRowCard key={row._id} row={row} />
      ))}
    </ScrollSection>
  )
}

function ContinueRowCard({ row }: { row: ContinueRow }): React.JSX.Element {
  const navigate = useNavigate()
  const removeProgress = useMutation(api.playback.remove)

  const isMovie = row.mediaType === 'movie'
  const movieFanart = useQuery({ ...fanartMovieQuery(row.imdbId), enabled: isMovie })
  const ext = useQuery({ ...tvExternalIdsQuery(row.tmdbId), enabled: !isMovie })
  const tvdbId = ext.data?.tvdb_id ?? undefined
  const tvFanart = useQuery({ ...fanartTvQuery(tvdbId), enabled: !isMovie && !!tvdbId })

  const logo = isMovie
    ? pickFanartLogo(movieFanart.data?.hdmovielogo ?? movieFanart.data?.movielogo ?? undefined)
    : pickFanartLogo(tvFanart.data?.clearlogo ?? tvFanart.data?.hdtvlogo ?? undefined)

  const backdrop = tmdbImage(row.backdropPath, 'w780') ?? ''
  const timeLeft = formatTimeLeft(row.positionSec, row.durationSec)
  const seasonEp =
    !isMovie && row.season !== undefined && row.episode !== undefined
      ? `S${pad(row.season)}E${pad(row.episode)}`
      : null
  const remaining = seasonEp ? `${seasonEp} · ${timeLeft}` : timeLeft
  const progress = row.durationSec > 0 ? (row.positionSec / row.durationSec) * 100 : 0

  const detailTarget = isMovie
    ? ({ to: '/movie/$id', params: { id: String(row.tmdbId ?? 0) } } as const)
    : ({ to: '/tv/$id', params: { id: String(row.tmdbId ?? 0) } } as const)

  const handleClick = (): void => {
    if (row.streamUrl && row.tmdbId) {
      navigate({
        to: '/watch/$mediaType/$id',
        params: { mediaType: row.mediaType, id: String(row.tmdbId) },
        search: {
          url: row.streamUrl,
          title: row.title ?? '',
          episodeLabel: row.episodeLabel,
          imdbId: row.imdbId,
          mediaType: row.mediaType,
          season: row.season,
          episode: row.episode,
          resumeSec: row.positionSec
        },
        viewTransition: false
      })
      return
    }
    navigate({ ...detailTarget, viewTransition: false })
  }

  return (
    <MediaContextMenu
      mediaType={row.mediaType}
      tmdbId={row.tmdbId ?? 0}
      title={row.title ?? ''}
      posterPath={row.posterPath ?? undefined}
      onPlay={handleClick}
      onRemove={() =>
        void removeProgress({
          imdbId: row.imdbId,
          season: row.season,
          episode: row.episode
        })
      }
      removeLabel="Remove"
    >
      <ContinueCard
        title={row.title ?? ''}
        backdrop={backdrop}
        logo={logo}
        remaining={remaining}
        progress={progress}
        onClick={handleClick}
        preload={detailTarget}
      />
    </MediaContextMenu>
  )
}
