import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { cn } from '@renderer/lib/cn'
import { CheckIcon } from '@renderer/components/icons'
import { langLabel } from '@renderer/lib/lang'
import { FlagTile } from './flag-tile'
import type { AudioTrack } from '@renderer/lib/use-audio-tracks'

interface Props {
  tracks: AudioTrack[]
  selectedIndex: number
  onSelect: (id: string) => void
  onOpenChange?: (open: boolean) => void
}

export function AudioMenu({
  tracks,
  selectedIndex,
  onSelect,
  onOpenChange
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const handle = (next: boolean): void => {
    setOpen(next)
    onOpenChange?.(next)
  }
  return (
    <Popover.Root open={open} onOpenChange={handle}>
      <Popover.Trigger
        aria-label="Audio"
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-transparent text-text-tertiary outline-none active:opacity-70'
        )}
      >
        <AudioGlyph />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={42} align="center" className="z-[100]">
          <Popover.Popup
            className={cn('w-[360px] overflow-hidden rounded-[14px] p-2 backdrop-blur-2xl')}
            style={{ backgroundColor: '#141414EB' }}
          >
            <div className="px-3 pt-2 pb-1">
              <span className="text-[11px] leading-[14px] font-bold tracking-[0.08em] text-white/50 uppercase">
                Audio Language
              </span>
            </div>
            <div className="flex max-h-[360px] flex-col gap-0.5 overflow-y-auto">
              {tracks.map((t, i) => {
                const active = i === selectedIndex
                return (
                  <Row key={t.id} active={active} onClick={() => onSelect(t.id)}>
                    <FlagTile lang={t.lang} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          'truncate text-[13px] leading-4 text-white',
                          active ? 'font-bold' : 'font-medium'
                        )}
                      >
                        {langLabel(t.lang) || t.label}
                      </span>
                      {formatSublabel(t) ? (
                        <span className="truncate text-[10px] leading-3 font-medium text-white/50">
                          {formatSublabel(t)}
                        </span>
                      ) : null}
                    </div>
                    {active ? <CheckIcon className="size-3.5 text-white" /> : null}
                  </Row>
                )
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Row({
  onClick,
  active,
  children
}: {
  onClick: () => void
  active: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full shrink-0 items-center gap-3 overflow-hidden rounded-lg px-3 text-left outline-none',
        active ? 'bg-white/[0.08]' : 'bg-transparent'
      )}
      style={{ height: 40 }}
    >
      {children}
    </button>
  )
}

function formatSublabel(t: AudioTrack): string {
  const parts: string[] = []
  if (t.kind === 'description') parts.push('Audio description')
  else if (t.kind === 'commentary') parts.push('Commentary')
  else if (t.isDefault) parts.push('Original')
  const codec = codecName(t.codec)
  if (codec) parts.push(codec)
  const ch = channelLabel(t.channels)
  if (ch) parts.push(ch)
  return parts.join(', ')
}

function codecName(codec?: string): string {
  if (!codec) return ''
  const c = codec.toLowerCase()
  if (c.startsWith('ec-3')) return 'Dolby Digital Plus'
  if (c.startsWith('ac-3')) return 'Dolby Digital'
  if (c.startsWith('mp4a')) return 'AAC'
  if (c.startsWith('opus')) return 'Opus'
  if (c.startsWith('flac')) return 'FLAC'
  return ''
}

function channelLabel(channels?: string): string {
  if (!channels) return ''
  const n = Number(channels.split('/')[0])
  if (n === 1) return 'mono'
  if (n === 2) return 'stereo'
  if (n === 6) return '5.1'
  if (n === 8) return '7.1'
  return `${n}ch`
}

function AudioGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <rect x="3.5" y="9" width="2" height="6" rx="1" />
      <rect x="7.5" y="6" width="2" height="12" rx="1" />
      <rect x="11.5" y="3" width="2" height="18" rx="1" />
      <rect x="15.5" y="6" width="2" height="12" rx="1" />
      <rect x="19" y="9" width="2" height="6" rx="1" />
    </svg>
  )
}
