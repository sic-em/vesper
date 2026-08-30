import { useEffect, useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { IconButton } from '@renderer/components/ui/icon-button'
import { Badge } from '@renderer/components/ui/badge'
import {
  FullscreenIcon,
  PlayIcon,
  PlusIcon,
  VolumeOffIcon,
  VolumeOnIcon
} from '@renderer/components/icons'
import { VideoModal } from '@renderer/components/media/video-modal'
import { OverviewModal } from '@renderer/components/media/overview-modal'
import { ImdbLogo } from '@renderer/components/brand/imdb-logo'
import { RtLogo } from '@renderer/components/brand/rt-logo'
import { MetacriticLogo } from '@renderer/components/brand/metacritic-logo'
import { AddToListsPopover } from '@renderer/components/library/add-to-lists-popover'
import { RatingButton } from '@renderer/components/media/rating-button'
import { cn } from '@renderer/lib/cn'

const TRAILER_DELAY_MS = 5000
const FADE_MS = 500
const YT_ORIGIN = 'https://www.youtube-nocookie.com'

export interface HeroProps {
  title: string
  logo?: string
  tags: string[]
  rating: string
  description: string
  year: number
  runtime: string
  metacritic?: number
  rottenTomatoes?: number
  imdb?: string
  starring: string
  director: string
  backdrop: string
  poster: string
  releaseLabel?: string
  mediaType: 'movie' | 'tv'
  tmdbId: number
  posterPath?: string
  trailerKey?: string
  onPlay?: () => void
  playBusy?: boolean
  resume?: { label: string; percent: number } | null
}

export function Hero({
  title,
  logo,
  tags,
  rating,
  description,
  year,
  runtime,
  metacritic,
  rottenTomatoes,
  imdb,
  starring,
  director,
  backdrop,
  poster,
  releaseLabel,
  mediaType,
  tmdbId,
  posterPath,
  trailerKey,
  onPlay,
  playBusy,
  resume
}: HeroProps): React.JSX.Element {
  const unreleased = !!releaseLabel
  const [overviewOpen, setOverviewOpen] = useState(false)
  return (
    <section
      className="relative flex h-[420px] w-full shrink-0 overflow-hidden rounded-lg bg-surface"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(black 60%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(black 60%, transparent 95%)'
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backdrop})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(black 65%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(black 65%, transparent 95%)'
        }}
      />
      {trailerKey ? <HeroTrailer ytKey={trailerKey} /> : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,18,18,0) 14.76%, rgba(18,18,18,0.55) 50%, rgba(18,18,18,0.92) 80%, #121212 90%, #121212 100%)'
        }}
      />
      <div className="relative flex w-full flex-col justify-end p-8">
        <div className="flex w-full items-end justify-between gap-8">
          <div className="flex max-w-[532px] flex-col gap-3">
            {logo ? (
              <img
                src={logo}
                alt={title}
                width={380}
                height={110}
                decoding="async"
                fetchPriority="high"
                className="mb-1 max-h-[110px] w-auto max-w-[380px]"
              />
            ) : (
              <h1 className="text-5xl leading-tight font-bold text-text">{title}</h1>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[13px] leading-4 font-medium text-text-secondary">
                {tags.join(', ')}
              </span>
              <Badge variant="chip" size="sm">
                {rating}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setOverviewOpen(true)}
              className="line-clamp-2 max-w-[460px] bg-transparent text-left text-[13px] leading-[1.5] font-medium text-text-secondary outline-none"
            >
              {description}
            </button>
            <div className="flex flex-wrap items-center gap-3 text-[13px] leading-4 font-medium text-text">
              <span>{year}</span>
              <span>{unreleased ? releaseLabel : runtime}</span>
              {metacritic !== undefined ? (
                <span className="inline-flex items-center gap-1.5">
                  <MetacriticLogo score={metacritic} className="size-4" />
                  {metacritic}
                </span>
              ) : null}
              {rottenTomatoes !== undefined ? (
                <span className="inline-flex items-center gap-1.5">
                  <RtLogo score={rottenTomatoes} className="size-4" />
                  {rottenTomatoes}%
                </span>
              ) : null}
              {imdb ? (
                <span className="inline-flex items-center gap-1.5">
                  <ImdbLogo className="h-[14px] w-auto" />
                  {imdb}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="primary"
                size="lg"
                className="h-[38px] gap-2.5 px-6"
                disabled={unreleased || playBusy}
                aria-disabled={unreleased || playBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  onPlay?.()
                }}
              >
                <PlayIcon className="size-3.5" />
                {resume ? (
                  <span
                    className={cn('h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-black/15')}
                  >
                    <span
                      className={cn('block h-full rounded-full bg-current')}
                      style={{ width: `${resume.percent}%` }}
                    />
                  </span>
                ) : null}
                {resume ? resume.label : 'Play'}
              </Button>
              <AddToListsPopover
                mediaType={mediaType}
                tmdbId={tmdbId}
                title={title}
                posterPath={posterPath}
              >
                <IconButton
                  variant="soft"
                  size="lg"
                  aria-label="Add to list"
                  className="rounded-[14px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlusIcon className="size-4" />
                </IconButton>
              </AddToListsPopover>
              <RatingButton
                mediaType={mediaType}
                tmdbId={tmdbId}
                title={title}
                posterPath={posterPath}
              />
            </div>
          </div>
          <div className="hidden w-[220px] shrink-0 flex-col gap-4 pb-1 text-[12px] leading-4 font-medium lg:flex">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text-faint">Starring</span>
              <span className="leading-[1.4] text-text">{starring}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text-faint">Director</span>
              <span className="leading-[1.4] text-text">{director}</span>
            </div>
          </div>
        </div>
      </div>
      <OverviewModal
        title={title}
        overview={description}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </section>
  )
}

type TrailerPhase = 'idle' | 'visible' | 'gone'

function HeroTrailer({ ytKey }: { ytKey: string }): React.JSX.Element | null {
  const [phase, setPhase] = useState<TrailerPhase>('idle')
  const [muted, setMuted] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    setPhase('idle')
    setMuted(true)
    const id = window.setTimeout(() => setPhase('visible'), TRAILER_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [ytKey])

  useEffect(() => {
    if (phase !== 'visible') return
    const onMsg = (e: MessageEvent): void => {
      if (e.origin !== YT_ORIGIN) return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onStateChange' && data.info === 0) {
          window.setTimeout(() => setPhase('gone'), FADE_MS)
        }
      } catch {
        /* noop */
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [phase])

  useEffect(() => {
    if (phase !== 'visible') return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] }),
      YT_ORIGIN
    )
  }, [muted, phase])

  const openFullscreen = (): void => {
    setPhase('gone')
    setFullscreen(true)
  }

  if (phase === 'gone') {
    return (
      <VideoModal
        ytKey={fullscreen ? ytKey : null}
        title="Trailer"
        open={fullscreen}
        onOpenChange={setFullscreen}
      />
    )
  }

  const src = `${YT_ORIGIN}/embed/${ytKey}?autoplay=1&mute=1&controls=0&loop=0&rel=0&playsinline=1&modestbranding=1&enablejsapi=1&disablekb=1&iv_load_policy=3`

  const onLoad = (): void => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'listening', id: 'vesper-trailer', channel: 'widget' }),
      YT_ORIGIN
    )
  }

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 overflow-hidden transition-opacity',
          phase === 'visible' ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transitionDuration: `${FADE_MS}ms`,
          maskImage: 'linear-gradient(black 65%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(black 65%, transparent 95%)'
        }}
      >
        {phase === 'visible' ? (
          <iframe
            ref={iframeRef}
            src={src}
            title="Trailer"
            allow="autoplay; encrypted-media"
            onLoad={onLoad}
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: '200%', height: '200%', border: 0 }}
          />
        ) : null}
      </div>
      <div
        className={cn(
          'absolute top-4 right-4 z-20 flex items-center gap-2 transition-opacity',
          phase === 'visible' ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <IconButton
          variant="glass"
          size="md"
          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <VolumeOffIcon className="size-4" /> : <VolumeOnIcon className="size-4" />}
        </IconButton>
        <IconButton
          variant="glass"
          size="md"
          aria-label="Open trailer fullscreen"
          onClick={openFullscreen}
        >
          <FullscreenIcon className="size-4" />
        </IconButton>
      </div>
      <VideoModal
        ytKey={fullscreen ? ytKey : null}
        title="Trailer"
        open={fullscreen}
        onOpenChange={setFullscreen}
      />
    </>
  )
}
