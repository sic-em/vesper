import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m as motion } from 'motion/react'
import { ScrollSection } from '@renderer/components/ui/scroll-section'
import { tvDetailsQuery, tvSeasonQuery } from '@renderer/lib/tmdb-queries'
import { tmdbImage, type TmdbEpisode } from '@renderer/lib/tmdb'
import { cn } from '@renderer/lib/cn'
import { CloseIcon } from '@renderer/components/icons'
import { ProgressBar } from '@renderer/components/ui/progress-bar'
import { resolveEpisodeWatch } from '@renderer/lib/play-episode'
import { ensureScrape, type ResolveStage } from '@renderer/lib/stream-orchestrator'

/** How long a pointer must settle on a card before its stream is worth warming. */
const WARM_HOVER_MS = 150

/**
 * What each stage of a resolve is actually doing, in the viewer's terms. A spinner alone leaves a
 * multi-second wait feeling stalled; a stage that changes proves it is still moving.
 */
const STAGE_LABEL: Record<ResolveStage, string> = {
  finding: 'Finding sources',
  opening: 'Opening stream',
  starting: 'Starting'
}

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
  onFailure: (message: string) => void
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
  onClose,
  onFailure
}: Props): React.JSX.Element {
  const navigate = useNavigate()
  const [loadingEpId, setLoadingEpId] = useState<number | null>(null)
  const [loadingStage, setLoadingStage] = useState<ResolveStage>('finding')
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
  // Dimming the rest is what marks the current episode, so it may only kick in on the season that
  // actually holds it — otherwise paging to another season would grey out every card at once.
  const showingCurrentEpisode = episodes.some(
    (ep) => ep.season_number === currentSeason && ep.episode_number === currentEpisode
  )

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

  // Autoplay gets a running start: it warms the next episode's scrape when the up-next card
  // appears, so the countdown is not where the wait begins. Picking from this rail started cold,
  // which is why it felt slower than an automatic advance doing the very same work. A pointer
  // resting on a card is the same kind of signal, so it earns the same head start. The scrape is
  // cached for ten minutes, so a hover that never becomes a click costs one request at most.
  const warmEpisode = useCallback(
    (ep: TmdbEpisode): void => {
      void ensureScrape({
        mediaType: 'tv',
        imdbId,
        tmdbId: tvTmdbId,
        season: ep.season_number,
        episode: ep.episode_number
      }).catch(() => {})
    },
    [imdbId, tvTmdbId]
  )

  const openEpisode = async (ep: TmdbEpisode): Promise<void> => {
    if (loadingEpId !== null) return
    setLoadingEpId(ep.id)
    setLoadingStage('finding')
    try {
      const search = await resolveEpisodeWatch({
        tvTmdbId,
        imdbId,
        showTitle,
        season: ep.season_number,
        episode: ep.episode_number,
        episodeName: ep.name,
        bingeGroup: currentBingeGroup,
        onStage: setLoadingStage
      })
      onClose()
      void navigate({
        to: '/watch/$mediaType/$id',
        params: { mediaType: 'tv', id: String(tvTmdbId) },
        search
      })
    } catch (err) {
      // A failure used to close the player and land the viewer on the show page, which reads as
      // the app losing its place rather than as one episode being unavailable. The next and
      // previous buttons already say so and stay put; this now matches. The menu is left open so
      // another episode is one click away instead of a journey back.
      console.error('Failed to resolve episode stream', err)
      onFailure('Could not start that episode')
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
                        dimmed={showingCurrentEpisode && !isCurrent}
                        loading={loadingEpId === ep.id}
                        loadingStage={loadingStage}
                        currentTimeSec={isCurrent ? currentTimeSec : 0}
                        durationSec={isCurrent ? durationSec : 0}
                        onClick={() => void openEpisode(ep)}
                        onWarm={() => warmEpisode(ep)}
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
  dimmed,
  loading,
  loadingStage,
  currentTimeSec,
  durationSec,
  onClick,
  onWarm
}: {
  episode: TmdbEpisode
  isCurrent: boolean
  dimmed: boolean
  loading: boolean
  loadingStage: ResolveStage
  currentTimeSec: number
  durationSec: number
  onClick: () => void
  onWarm: () => void
}): React.JSX.Element {
  const still = tmdbImage(episode.still_path, 'w500')
  const played = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0
  const remainingSec = durationSec > 0 ? durationSec - currentTimeSec : 0

  // Held off briefly so dragging the pointer along the rail does not scrape every episode it
  // crosses; only a pointer that settles on a card counts as interest.
  const warmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelWarm = (): void => {
    if (warmTimer.current) {
      clearTimeout(warmTimer.current)
      warmTimer.current = null
    }
  }
  useEffect(() => cancelWarm, [])
  const scheduleWarm = (): void => {
    cancelWarm()
    warmTimer.current = setTimeout(onWarm, WARM_HOVER_MS)
  }

  return (
    <button
      type="button"
      data-ep={episode.episode_number}
      onClick={onClick}
      onPointerEnter={scheduleWarm}
      onPointerLeave={cancelWarm}
      onFocus={scheduleWarm}
      onBlur={cancelWarm}
      aria-current={isCurrent ? 'true' : undefined}
      aria-label={`${episode.name}, season ${episode.season_number} episode ${episode.episode_number}`}
      className={cn(
        'group/ep flex w-[200px] shrink-0 flex-col gap-2 text-left outline-none transition-opacity duration-200',
        // A ring gets swallowed by a bright still, so the episode being watched is marked by
        // holding its brightness while the rest of the rail steps back. Hover restores a card so
        // the dimming never reads as "disabled".
        dimmed && 'opacity-55 hover:opacity-100 focus-visible:opacity-100'
      )}
    >
      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-3 bg-cover bg-center"
        style={still ? { backgroundImage: `url(${still})` } : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'
          }}
        />
        {isCurrent ? (
          // Inverted against every other badge in the rail, so it is the one bright object.
          <span className="absolute right-2 bottom-2 rounded bg-white px-1.5 py-0.5 text-[10px] leading-4 font-semibold tracking-[0.06em] text-black uppercase">
            Now playing
          </span>
        ) : (
          <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] leading-4 font-medium text-white">
            {`E${pad(episode.episode_number)}${episode.runtime ? `, ${episode.runtime}m` : ''}`}
          </span>
        )}
        {isCurrent && durationSec > 0 ? (
          <ProgressBar
            value={played}
            tone="light"
            className="absolute inset-x-0 bottom-0 rounded-none"
          />
        ) : null}
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
            <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-[10px] leading-3 font-semibold tracking-[0.06em] text-white/75 uppercase">
              {STAGE_LABEL[loadingStage]}
            </span>
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
      {isCurrent && remainingSec > 0 ? (
        <span className="-mt-1 text-[11px] leading-4 font-medium text-white/55 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {formatRemaining(remainingSec)}
        </span>
      ) : null}
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

/** Time left on the episode. Hour-aware, so a feature-length finale never reads as "78 min left". */
function formatRemaining(sec: number): string {
  const minutes = Math.max(1, Math.round(sec / 60))
  if (minutes < 60) return `${minutes} min left`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h left` : `${h}h ${m}m left`
}
