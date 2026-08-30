import { Dialog } from '@base-ui/react/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Space'], label: 'Play / Pause' },
  { keys: ['←'], label: 'Skip −10s' },
  { keys: ['→'], label: 'Skip +10s' },
  { keys: ['J'], label: 'Skip −30s' },
  { keys: ['L'], label: 'Skip +30s' },
  { keys: ['0', '–', '9'], label: 'Seek to 0–90%' },
  { keys: ['F'], label: 'Fullscreen toggle' },
  { keys: ['M'], label: 'Mute toggle' },
  { keys: ['Z'], label: 'Subtitle offset −0.1s' },
  { keys: ['X'], label: 'Subtitle offset +0.1s' },
  { keys: ['⇧', 'Z'], label: 'Subtitle offset −0.5s' },
  { keys: ['⇧', 'X'], label: 'Subtitle offset +0.5s' },
  { keys: ['Esc'], label: 'Back to home' }
]

export function KeyboardShortcutsModal({ open, onOpenChange }: Props): React.JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md" />
        <Dialog.Popup
          className="fixed top-1/2 left-1/2 z-[100] w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1a1a1a] p-5 shadow-2xl"
          aria-label="Keyboard shortcuts"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] leading-5 font-bold text-white">Keyboard shortcuts</h2>
          </div>
          <div className="flex flex-col gap-2">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3">
                <span className="text-[13px] leading-4 font-medium text-white/75">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <span
                      key={i}
                      className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-white/[0.08] px-1.5 text-[11px] leading-3 font-semibold text-white/90"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
