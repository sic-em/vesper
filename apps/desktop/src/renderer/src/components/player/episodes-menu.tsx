import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m as motion } from 'motion/react'
import { ScrollSection } from '@renderer/components/ui/scroll-section'
import { tvDetailsQuery, tvSeasonQuery } from '@renderer/lib/tmdb-queries'
import { tmdbImage, type TmdbEpisode } from '@renderer/lib/tmdb'
import { cn } from '@renderer/lib/cn'
import { CloseIcon } from '@renderer/components/icons'
import { scrapeAndRace } from '@renderer/lib/stream-orchestrator'

interface Props {
  open: boolean
  tvTmdbId: number
  imdbId: string
  showTitle: string
  currentSeason: number
  currentEpisode: number
  currentTimeSec: number
  durationSec: number
  currentBingeGroup?: string
  onClose: () => void
}

export function EpisodesMenu({
  open,
  tvTmdbId,
  imdbId,
  showTitle,
  currentSeason,
  currentEpisode,
  currentTimeSec,
  durationSec,
  currentBingeGroup,
  onClose
}: Props): React.JSX.Element {
  const navigate = useNavigate()
  const [loadingEpId, setLoadingEpId] = useState<number | null>(null)
  const details = useQuery({ ...tvDetailsQuery(tvTmdbId), enabled: open })
  const realSeasons = (details.data?.seasons ?? []).filter((s) => s.season_number >= 1)
  const seasonNumbers = realSeasons.map((s) => s.season_number)
  const minSeason = seasonNumbers[0] ?? 1
  const maxSeason = seasonNumbers[seasonNumbers.length - 1] ?? 1

  const [shownSeason, setShownSeason] = useShownSeason(currentSeason, open)

  const seasonQuery = useQuery({
    ...tvSeasonQuery(tvTmdbId, shownSeason),
    enabled: open && Number.isFinite(tvTmdbId) && tvTmdbId > 0
  })
  const episodes = seasonQuery.data?.episodes ?? []
  const showName = details.data?.name ?? ''

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (episodes.length === 0) return
    if (shownSeason !== currentSeason) return
    const target = document.querySelector<HTMLElement>(
      `[data-episodes-menu] [data-ep="${currentEpisode}"]`
    )
    if (target) target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' })
  }, [open, episodes.length, shownSeason, currentSeason, currentEpisode])

  const openEpisode = async (ep: TmdbEpisode): Promise<void> => {
    if (loadingEpId !== null) return
    setLoadingEpId(ep.id)
    try {
      const { stream: pick, url } = await scrapeAndRace({
        scrape: {
          mediaType: 'tv',
          imdbId,
          tmdbId: tvTmdbId,
          season: ep.season_number,
          episode: ep.episode_number
        },
        bingeGroup: currentBingeGroup
      })
      onClose()
      void navigate({
        to: '/watch/$mediaType/$id',
        params: { mediaType: 'tv', id: String(tvTmdbId) },
        search: {
          url,
          title: showTitle,
          episodeLabel: ep.name
            ? `S${ep.season_number}E${ep.episode_number} · ${ep.name}`
            : `S${ep.season_number}E${ep.episode_number}`,
          imdbId,
          mediaType: 'tv',
          season: ep.season_number,
          episode: ep.episode_number,
          filename: pick.filename,
          bingeGroup: pick.bingeGroup
        }
      })
    } catch (err) {
      console.error('Failed to resolve episode stream', err)
      onClose()
      void navigate({
        to: '/tv/$id',
        params: { id: String(tvTmdbId) },
        search: { play: true, playSeason: ep.season_number, playEpisode: ep.episode_number }
      })
    } finally {
      setLoadingEpId(null)
    }
  }

  const prevDisabled = shownSeason <= minSeason
  const nextDisabled = shownSeason >= maxSeason

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="pointer-events-auto absolute inset-0 z-20"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            aria-hidden
          />
          <motion.div
            data-episodes-menu
            className="pointer-events-auto absolute right-0 bottom-[120px] left-0 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <ScrollSection
              title={
                <span className="text-[18px] leading-tight font-semibold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  {showName}
                </span>
              }
              titleAside={
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur-md">
                  <button
                    type="button"
                    aria-label="Previous season"
                    onClick={() => setShownSeason(Math.max(minSeason, shownSeason - 1))}
                    disabled={prevDisabled}
                    className="flex size-6 items-center justify-center rounded-full text-white outline-none disabled:opacity-30"
                  >
                    <ChevronLeftGlyph />
                  </button>
                  <span className="px-1 text-[12px] leading-4 font-medium text-white tabular-nums">
                    Season {shownSeason}
                  </span>
                  <button
                    type="button"
                    aria-label="Next season"
                    onClick={() => setShownSeason(Math.min(maxSeason, shownSeason + 1))}
                    disabled={nextDisabled}
                    className="flex size-6 items-center justify-center rounded-full text-white outline-none disabled:opacity-30"
                  >
                    <ChevronRightGlyph />
                  </button>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="ml-1 flex size-6 items-center justify-center rounded-full text-white outline-none"
                  >
                    <CloseIcon className="size-3" />
                  </button>
                </div>
              }
            >
              {seasonQuery.isPending
                ? Array.from({ length: 6 }).map((_, i) => <EpisodeSkeleton key={i} />)
                : episodes.map((ep) => {
                    const isCurrent =
                      ep.season_number === currentSeason && ep.episode_number === currentEpisode
                    return (
                      <EpisodeCard
                        key={ep.id}
                        episode={ep}
                        isCurrent={isCurrent}
                        loading={loadingEpId === ep.id}
                        currentTimeSec={isCurrent ? currentTimeSec : 0}
                        durationSec={isCurrent ? durationSec : 0}
                        onClick={() => void openEpisode(ep)}
                      />
                    )
                  })}
              <div aria-hidden className="w-6 shrink-0" />
            </ScrollSection>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function useShownSeason(currentSeason: number, open: boolean): [number, (n: number) => void] {
  const [shown, setShown] = useState(currentSeason)
  useEffect(() => {
    if (open) setShown(currentSeason)
  }, [open, currentSeason])
  return [shown, setShown]
}

function EpisodeCard({
  episode,
  isCurrent,
  loading,
  currentTimeSec,
  durationSec,
  onClick
}: {
  episode: TmdbEpisode
  isCurrent: boolean
  loading: boolean
  currentTimeSec: number
  durationSec: number
  onClick: () => void
}): React.JSX.Element {
  const still = tmdbImage(episode.still_path, 'w500')
  const label =
    isCurrent && durationSec > 0
      ? `${formatTime(currentTimeSec)} / ${formatTime(durationSec)}`
      : `E${pad(episode.episode_number)}${episode.runtime ? `, ${episode.runtime}m` : ''}`
  return (
    <button
      type="button"
      data-ep={episode.episode_number}
      onClick={onClick}
      aria-label={`${episode.name}, season ${episode.season_number} episode ${episode.episode_number}`}
      className="group/ep flex w-[200px] shrink-0 flex-col gap-2 text-left outline-none"
    >
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg bg-surface-3 bg-cover bg-center',
          isCurrent && 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.45)]'
        )}
        style={still ? { backgroundImage: `url(${still})` } : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'
          }}
        />
        <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] leading-4 font-medium text-white">
          {label}
        </span>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        ) : null}
      </div>
      <span
        className={cn(
          'line-clamp-1 text-[13px] leading-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
          isCurrent ? 'font-bold' : 'font-medium'
        )}
      >
        {episode.name}
      </span>
    </button>
  )
}

function EpisodeSkeleton(): React.JSX.Element {
  return (
    <div className="flex w-[200px] shrink-0 flex-col gap-2">
      <div className="aspect-video w-full animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
    </div>
  )
}

function ChevronLeftGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
