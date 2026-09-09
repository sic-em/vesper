import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Hls from 'hls.js'
import { Popover } from '@base-ui/react/popover'
import { cn } from '@renderer/lib/cn'
import { squircleStyle } from '@renderer/components/ui/squircle-surface'
import { CheckIcon } from '@renderer/components/icons'
import {
  BackArrowIcon,
  BigPauseIcon,
  BigPlayIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  IconButton,
  SpinnerIcon,
  StreamsGlyph,
  VolumeFullIcon,
  VolumeHalfIcon,
  VolumeMuteIcon,
  VolumeSlider
} from '@renderer/components/player/hls-chrome'
import { movieDetailsQuery, tvDetailsQuery } from '@renderer/lib/tmdb-queries'
import { tmdbImage } from '@renderer/lib/tmdb'
import { WEB_SOURCES, webEmbedUrl, webSourceById, type WebSource } from '@renderer/lib/web-sources'
import { useDiscordPresence } from '@renderer/hooks/use-discord-presence'

// Web players are HLS behind an embed page (ADR-0018), so like live fights
// they play through hls.js + <video> rather than the custom engine
// (ADR-0016). Unlike fights they are finite, so this route has a seek bar and
// keeps its position in the presence card; it still does not save progress.

type SearchParams = {
  title: string
  episodeLabel?: string
  season?: number
  episode?: number
  /** WebSource id to start with; failover walks the rest of the list. */
  source?: string
}

export const Route = createFileRoute('/_authenticated/watch-web/$mediaType/$id')({
  validateSearch: (search): SearchParams => {
    const s = search as Record<string, unknown>
    return {
      title: String(s.title ?? ''),
      episodeLabel: s.episodeLabel ? String(s.episodeLabel) : undefined,
      season: typeof s.season === 'number' ? s.season : undefined,
      episode: typeof s.episode === 'number' ? s.episode : undefined,
      source: s.source ? String(s.source) : undefined
    }
  },
  component: WatchWebPage
})

const CHROME_HIDE_MS = 2500
const VOLUME_KEY = 'vesper.player.volume'
const MAX_AUTO_ATTEMPTS = 3
const SEEK_STEP_SEC = 10

type Phase = 'loading' | 'playing' | 'error'

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

function WatchWebPage(): React.JSX.Element {
  const search = Route.useSearch()
  const params = Route.useParams()
  const navigate = useNavigate()
  const mediaType: 'movie' | 'tv' = params.mediaType === 'tv' ? 'tv' : 'movie'
  const tmdbId = Number(params.id)

  const goBack = useCallback((): void => {
    void navigate({
      to: mediaType === 'movie' ? '/movie/$id' : '/tv/$id',
      params: { id: params.id }
    })
  }, [navigate, mediaType, params.id])

  const movieDetails = useQuery({ ...movieDetailsQuery(tmdbId), enabled: mediaType === 'movie' })
  const tvDetails = useQuery({ ...tvDetailsQuery(tmdbId), enabled: mediaType === 'tv' })
  const details = mediaType === 'movie' ? movieDetails.data : tvDetails.data
  const backdrop = tmdbImage(details?.backdrop_path, 'original') ?? undefined
  const poster = tmdbImage(details?.poster_path, 'w500') ?? undefined

  // The chosen source leads; the rest follow in list order for failover.
  const ordered = useMemo(() => {
    const first = search.source ? webSourceById(search.source) : undefined
    return first ? [first, ...WEB_SOURCES.filter((s) => s.id !== first.id)] : WEB_SOURCES
  }, [search.source])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const attemptRef = useRef(0)
  const menuOpenRef = useRef(false)
  const recoveredRef = useRef(false)

  const [phase, setPhase] = useState<Phase>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(() => {
    const v = Number(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 1
  })

  const selected = useMemo(
    () => ordered.find((s) => s.id === selectedId) ?? null,
    [ordered, selectedId]
  )

  const destroyHls = useCallback((): void => {
    hlsRef.current?.destroy()
    hlsRef.current = null
  }, [])

  const startSourceRef = useRef<((s: WebSource, autoIndex: number | null) => Promise<void>) | null>(
    null
  )

  const startSource = useCallback(
    async (source: WebSource, autoIndex: number | null): Promise<void> => {
      const attempt = ++attemptRef.current
      recoveredRef.current = false
      destroyHls()
      setPhase('loading')
      setSelectedId(source.id)

      const failOver = (): void => {
        if (attempt !== attemptRef.current) return
        destroyHls()
        // The first auto-pick walks the list on its own; once the viewer has
        // chosen, failure surfaces the switcher instead.
        if (autoIndex !== null && autoIndex + 1 < Math.min(ordered.length, MAX_AUTO_ATTEMPTS)) {
          void startSourceRef.current?.(ordered[autoIndex + 1], autoIndex + 1)
          return
        }
        setPhase('error')
        setSwitcherOpen(false)
        menuOpenRef.current = false
      }

      let playlistUrl: string
      try {
        const embedUrl = webEmbedUrl(source, {
          mediaType,
          tmdbId,
          season: search.season,
          episode: search.episode
        })
        playlistUrl = await window.api.embed.resolveStream(embedUrl)
      } catch {
        failOver()
        return
      }
      if (attempt !== attemptRef.current) return
      const video = videoRef.current
      if (!video) return

      const hls = new Hls({ enableWorker: true })
      hlsRef.current = hls
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        // Best quality always, same rule as fights: no silent ABR downgrade.
        let top = 0
        for (let i = 0; i < data.levels.length; i++) {
          if ((data.levels[i].bitrate ?? 0) > (data.levels[top].bitrate ?? 0)) top = i
        }
        hls.currentLevel = top
        void video.play().catch(() => undefined)
        if (attempt === attemptRef.current) setPhase('playing')
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredRef.current) {
          recoveredRef.current = true
          hls.recoverMediaError()
          return
        }
        failOver()
      })
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)
    },
    [destroyHls, ordered, mediaType, tmdbId, search.season, search.episode]
  )

  useEffect(() => {
    startSourceRef.current = startSource
  }, [startSource])

  const autoStartedRef = useRef(false)
  useEffect(() => {
    if (autoStartedRef.current || ordered.length === 0) return
    autoStartedRef.current = true
    void startSource(ordered[0], 0)
  }, [ordered, startSource])

  useEffect(() => destroyHls, [destroyHls])

  // Video element state mirroring.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = (): void => setPaused(false)
    const onPause = (): void => setPaused(true)
    const onTime = (): void => setCurrentTime(video.currentTime)
    const onDuration = (): void => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    }
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('durationchange', onDuration)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('durationchange', onDuration)
    }
  }, [])
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume
      video.muted = muted
    }
  }, [volume, muted])

  const togglePause = useCallback((): void => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }, [])

  const seekTo = useCallback((sec: number): void => {
    const video = videoRef.current
    if (!video) return
    const max = Number.isFinite(video.duration) ? video.duration : sec
    video.currentTime = Math.max(0, Math.min(max, sec))
    setCurrentTime(video.currentTime)
  }, [])

  const seekBy = useCallback(
    (delta: number): void => {
      const video = videoRef.current
      if (video) seekTo(video.currentTime + delta)
    },
    [seekTo]
  )

  const handleVolume = useCallback((v: number): void => {
    setVolume(v)
    setMuted(v === 0)
    localStorage.setItem(VOLUME_KEY, String(v))
  }, [])

  // Fullscreen tracks the OS window, same as the VOD player.
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    void window.api.window.isFullScreen().then(setIsFullscreen)
    return window.api.window.onFullScreenChange(setIsFullscreen)
  }, [])
  const toggleFullscreen = useCallback((): void => {
    void window.api.window.setFullScreen(!isFullscreen)
  }, [isFullscreen])

  // Chrome auto-hide.
  const [chromeVisible, setChromeVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleHide = useCallback((): void => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      if (!menuOpenRef.current) setChromeVisible(false)
    }, CHROME_HIDE_MS)
  }, [])
  const poke = useCallback((): void => {
    setChromeVisible(true)
    scheduleHide()
  }, [scheduleHide])
  useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [scheduleHide])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === ' ') {
        e.preventDefault()
        togglePause()
      } else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'm' || e.key === 'M') setMuted((m) => !m)
      else if (e.key === 'ArrowLeft') seekBy(-SEEK_STEP_SEC)
      else if (e.key === 'ArrowRight') seekBy(SEEK_STEP_SEC)
      else if (e.key === 'Escape' && !isFullscreen) goBack()
      else return
      poke()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause, toggleFullscreen, seekBy, isFullscreen, goBack, poke])

  const title =
    search.title || (mediaType === 'movie' ? movieDetails.data?.title : tvDetails.data?.name) || ''

  useDiscordPresence({
    title,
    poster,
    season: mediaType === 'tv' ? (search.season ?? null) : null,
    episode: mediaType === 'tv' ? (search.episode ?? null) : null,
    epTitle:
      mediaType === 'tv' && search.episodeLabel
        ? search.episodeLabel.replace(/^S\d+E\d+\s*[·\-–—]\s*/i, '')
        : null,
    currentTime,
    duration,
    playing: phase === 'playing' && !paused
  })

  const showChrome = chromeVisible || phase !== 'playing'

  return (
    <div
      className={cn('fixed inset-0 z-50 flex flex-col bg-black', !showChrome && 'cursor-none')}
      onMouseMove={poke}
      onClick={poke}
    >
      <div className="app-drag pointer-events-auto absolute inset-x-0 top-0 z-40 h-12" />
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        onClick={togglePause}
      />

      {phase === 'loading' ? <LoadingOverlay backdrop={backdrop} source={selected} /> : null}
      {phase === 'error' ? (
        <ErrorOverlay
          sources={ordered}
          selectedId={selectedId}
          onPick={(s) => void startSource(s, null)}
          onBack={goBack}
        />
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-30 transition-opacity duration-200',
          showChrome ? 'opacity-100' : 'opacity-0 [&_*]:!pointer-events-none'
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[140px]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, oklab(0% 0 0 / 70%) 0%, oklab(0% 0 0 / 0%) 100%)'
          }}
        />
        <div className="pointer-events-auto absolute inset-x-8 top-12 flex items-center gap-[18px]">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-white outline-none"
          >
            <BackArrowIcon />
          </button>
          <div className="flex flex-col gap-[3px]">
            <h1 className="text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-white">
              {title}
            </h1>
            {search.episodeLabel || selected ? (
              <span className="text-[11px] leading-[14px] font-medium tracking-[0.12em] text-white/55 uppercase">
                {[search.episodeLabel, selected?.name].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px]"
          style={{
            backgroundImage:
              'linear-gradient(0deg, oklab(0% 0 0 / 85%) 0%, oklab(0% 0 0 / 0%) 100%)'
          }}
        />
        <div className="pointer-events-auto absolute inset-x-8 bottom-4 flex flex-col gap-3">
          <SeekBar value={currentTime} max={duration} onSeek={seekTo} onInteract={poke} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePause}
                aria-label={paused ? 'Play' : 'Pause'}
                className="flex size-12 items-center justify-center text-white outline-none"
              >
                {paused ? <BigPlayIcon /> : <BigPauseIcon />}
              </button>
              <span className="text-[12px] leading-4 font-medium text-white/70 tabular-nums">
                {formatTime(currentTime)}
                <span className="text-white/40"> / {formatTime(duration)}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pr-1.5">
                <IconButton
                  aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted || volume === 0 ? (
                    <VolumeMuteIcon />
                  ) : volume < 0.5 ? (
                    <VolumeHalfIcon />
                  ) : (
                    <VolumeFullIcon />
                  )}
                </IconButton>
                <VolumeSlider value={muted ? 0 : volume} onChange={handleVolume} />
              </div>
              <SourceSwitcher
                sources={ordered}
                selectedId={selectedId}
                open={switcherOpen}
                onOpenChange={(open) => {
                  setSwitcherOpen(open)
                  menuOpenRef.current = open
                  if (!open) poke()
                }}
                onPick={(s) => {
                  setSwitcherOpen(false)
                  menuOpenRef.current = false
                  void startSource(s, null)
                }}
              />
              <IconButton
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SeekBar({
  value,
  max,
  onSeek,
  onInteract
}: {
  value: number
  max: number
  onSeek: (sec: number) => void
  onInteract: () => void
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragPct, setDragPct] = useState(0)
  const pct = dragging ? dragPct : max > 0 ? Math.min(100, (value / max) * 100) : 0

  const pctAt = (e: React.MouseEvent | MouseEvent): number => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  }

  const onDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (max <= 0) return
    e.stopPropagation()
    setDragging(true)
    setDragPct(pctAt(e))
    onInteract()
    const onMove = (ev: MouseEvent): void => {
      setDragPct(pctAt(ev))
      onInteract()
    }
    const onUp = (ev: MouseEvent): void => {
      setDragging(false)
      onSeek((pctAt(ev) / 100) * max)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={trackRef}
      onMouseDown={onDown}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.floor(max)}
      aria-valuenow={Math.floor(value)}
      className={cn(
        'group relative h-5 w-full cursor-pointer',
        max <= 0 && 'pointer-events-none opacity-40'
      )}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/18 transition-[height] duration-150 group-hover:h-1.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-opacity duration-150',
          dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}

function LoadingOverlay({
  backdrop,
  source
}: {
  backdrop?: string
  source: WebSource | null
}): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
      {backdrop ? (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm"
        />
      ) : null}
      <div className="relative flex flex-col items-center gap-3">
        <SpinnerIcon />
        <span className="text-[13px] leading-4 font-medium text-white/70">
          {source ? `Asking ${source.name} for the stream` : 'Finding the stream'}
        </span>
      </div>
    </div>
  )
}

function ErrorOverlay({
  sources,
  selectedId,
  onPick,
  onBack
}: {
  sources: WebSource[]
  selectedId: string | null
  onPick: (s: WebSource) => void
  onBack: () => void
}): React.JSX.Element {
  const others = sources.filter((s) => s.id !== selectedId)
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
      <div
        className="flex w-[420px] flex-col gap-4 p-6"
        style={{ backgroundColor: '#141414', ...squircleStyle('frame-sm') }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[16px] leading-5 font-bold text-white">
            That player has nothing for this title
          </span>
          <span className="text-[13px] leading-4 text-white/60">
            {others.length > 0
              ? 'Try another web player.'
              : 'None of the web players carry it right now.'}
          </span>
        </div>
        {others.length > 0 ? (
          <div className="flex max-h-[280px] flex-col gap-0.5 overflow-y-auto">
            {others.map((s) => (
              <SourceRow key={s.id} source={s} active={false} onClick={() => onPick(s)} />
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="self-start rounded-full bg-white/10 px-4 py-2 text-[13px] leading-4 font-medium text-white outline-none"
        >
          Back
        </button>
      </div>
    </div>
  )
}

function SourceSwitcher({
  sources,
  selectedId,
  open,
  onOpenChange,
  onPick
}: {
  sources: WebSource[]
  selectedId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (s: WebSource) => void
}): React.JSX.Element {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        aria-label="Switch web player"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-transparent text-text-tertiary outline-none active:opacity-70"
      >
        <StreamsGlyph />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={42} align="center" className="z-[100]">
          <Popover.Popup
            className="w-[360px] overflow-hidden p-2 backdrop-blur-2xl"
            style={{ backgroundColor: '#141414EB', ...squircleStyle('frame-sm') }}
          >
            <div className="px-3 pt-2 pb-1">
              <span className="text-[11px] leading-[14px] font-bold tracking-[0.08em] text-white/50 uppercase">
                Web players
              </span>
            </div>
            <div className="flex max-h-[360px] flex-col gap-0.5 overflow-y-auto">
              {sources.map((s) => (
                <SourceRow
                  key={s.id}
                  source={s}
                  active={s.id === selectedId}
                  onClick={() => onPick(s)}
                />
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function SourceRow({
  source,
  active,
  onClick
}: {
  source: WebSource
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full shrink-0 items-center gap-3 overflow-hidden rounded-lg px-3 text-left outline-none',
        active ? 'bg-white/[0.08]' : 'bg-transparent'
      )}
      style={{ height: 44 }}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[13px] leading-4 text-white',
          active ? 'font-bold' : 'font-medium'
        )}
      >
        {source.name}
      </span>
      {active ? <CheckIcon className="size-3.5 shrink-0 text-white" /> : null}
    </button>
  )
}
