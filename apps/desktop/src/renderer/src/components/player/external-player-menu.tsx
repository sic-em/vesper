import { useEffect, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { cn } from '@renderer/lib/cn'
import vlcIcon from './external-player-icons/vlc.svg'
import mpvIcon from './external-player-icons/mpv.svg'
import iinaIcon from './external-player-icons/iina.png'

type PlayerId = 'vlc' | 'iina' | 'mpv'

const PLAYER_ICONS: Record<PlayerId, string> = {
  vlc: vlcIcon,
  iina: iinaIcon,
  mpv: mpvIcon
}

interface Props {
  streamUrl: string
  getPosition: () => number
  onBeforeLaunch: () => void
  onOpenChange?: (open: boolean) => void
}

export function ExternalPlayerMenu({
  streamUrl,
  getPosition,
  onBeforeLaunch,
  onOpenChange
}: Props): React.JSX.Element | null {
  const [players, setPlayers] = useState<Array<{ id: PlayerId; name: string }>>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    window.api.externalPlayer
      .list()
      .then((list) => {
        if (alive) setPlayers(list)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (players.length === 0) return null

  const handle = (next: boolean): void => {
    setOpen(next)
    onOpenChange?.(next)
  }

  const launch = (id: PlayerId): void => {
    onBeforeLaunch()
    void window.api.externalPlayer.open(id, streamUrl, getPosition())
    handle(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={handle}>
      <Popover.Trigger
        aria-label="Open in external player"
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center bg-transparent text-white outline-none active:opacity-70'
        )}
      >
        <ExternalGlyph />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={42} align="center" className="z-[100]">
          <Popover.Popup
            className={cn('w-[240px] overflow-hidden rounded-[14px] p-2 backdrop-blur-2xl')}
            style={{ backgroundColor: '#141414EB' }}
          >
            <div className="px-3 pt-2 pb-1">
              <span className="text-[11px] leading-[14px] font-bold tracking-[0.08em] text-white/50 uppercase">
                Open in external player
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => launch(p.id)}
                  className="flex w-full shrink-0 items-center gap-3 overflow-hidden rounded-lg bg-transparent px-3 text-left outline-none"
                  style={{ height: 40 }}
                >
                  <img src={PLAYER_ICONS[p.id]} alt="" className="size-5 shrink-0" />
                  <span className="truncate text-[13px] leading-4 font-medium text-white">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ExternalGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M9.25 5.75H6.875C5.82559 5.75 5.30088 5.75 4.89489 5.94202C4.4766 6.13986 4.13986 6.4766 3.94202 6.89489C3.75 7.30088 3.75 7.82559 3.75 8.875V17.05C3.75 18.1701 3.75 18.7302 3.96799 19.158C4.15973 19.5343 4.46569 19.8403 4.84202 20.032C5.26984 20.25 5.8299 20.25 6.95 20.25H15.05C16.1701 20.25 16.7302 20.25 17.158 20.032C17.5343 19.8403 17.8403 19.5343 18.032 19.158C18.25 18.7302 18.25 18.1701 18.25 17.05V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.75 3.75H20.25M20.25 3.75V10.25M20.25 3.75L11 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
