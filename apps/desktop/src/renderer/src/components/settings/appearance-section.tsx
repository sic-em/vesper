import { useEffect, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { Button } from '@renderer/components/ui/button'
import { SquircleSurface } from '@renderer/components/ui/squircle-surface'
import { isWindows } from '@renderer/lib/platform'

import popcornImg from './variant-icons/popcorn.png'
import hiddenLeafImg from './variant-icons/hidden-leaf.png'
import akatsukiImg from './variant-icons/akatsuki.png'
import sodaImg from './variant-icons/soda.png'
import threeDeeImg from './variant-icons/3d.png'
import superSaiyanImg from './variant-icons/super-saiyan.png'
import ramenImg from './variant-icons/ramen.png'

type IconVariantId =
  | 'popcorn'
  | 'hidden-leaf'
  | 'akatsuki'
  | 'soda'
  | '3d'
  | 'super-saiyan'
  | 'ramen'

interface IconVariant {
  id: IconVariantId
  label: string
  image: string
}

const VARIANTS: IconVariant[] = [
  { id: 'popcorn', label: 'Popcorn', image: popcornImg },
  { id: 'hidden-leaf', label: 'Hidden Leaf', image: hiddenLeafImg },
  { id: 'akatsuki', label: 'Akatsuki', image: akatsukiImg },
  { id: 'soda', label: 'Soda', image: sodaImg },
  { id: '3d', label: '3D', image: threeDeeImg },
  { id: 'super-saiyan', label: 'Super Saiyan', image: superSaiyanImg },
  { id: 'ramen', label: 'Ramen', image: ramenImg }
]

export function AppearanceSection(): React.JSX.Element {
  const [variant, setVariant] = useState<IconVariantId>('popcorn')
  const [restartOpen, setRestartOpen] = useState(false)

  useEffect(() => {
    let active = true
    void window.api.appIcon.getVariant().then((id) => {
      if (active) setVariant(id)
    })
    return () => {
      active = false
    }
  }, [])

  const select = (id: IconVariantId): void => {
    if (id === variant) return
    const previous = variant
    setVariant(id)
    window.api.appIcon
      .setVariant(id)
      .then(() => {
        // Windows rereads the shortcut icon only on launch, so the taskbar needs a restart.
        if (isWindows) setRestartOpen(true)
      })
      .catch(() => setVariant(previous))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 px-1 pt-3">
        <span className="text-[13px] leading-4 font-medium text-text">App icon</span>
        <span className="text-[12px] leading-4 font-medium text-text-muted">
          Changes the icon in your taskbar, Start Menu, and Dock.
        </span>
      </div>
      <div className="flex flex-wrap gap-3 px-1">
        {VARIANTS.map((v) => (
          <Tooltip key={v.id} label={v.label}>
            <button
              type="button"
              aria-label={`${v.label} icon`}
              aria-pressed={variant === v.id}
              onClick={() => select(v.id)}
              className={`h-[64px] w-[64px] overflow-hidden rounded-lg bg-surface-2 outline-none transition-[transform,opacity] duration-150 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-white/30 ${
                variant === v.id ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <img
                src={v.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover select-none"
              />
            </button>
          </Tooltip>
        ))}
      </div>

      <Dialog.Root open={restartOpen} onOpenChange={setRestartOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup
            aria-label="Restart Vesper"
            className="fixed top-1/2 left-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 outline-none"
          >
            <SquircleSurface variant="frame" className="p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-1.5 px-2.5 pt-2 pb-1">
                <Dialog.Title className="text-[15px] leading-5 font-medium text-text">
                  Restart to see the new icon
                </Dialog.Title>
                <Dialog.Description className="text-[13px] leading-5 font-medium text-text-tertiary">
                  Windows picks up the taskbar icon when Vesper starts. Your pick is saved either
                  way.
                </Dialog.Description>
              </div>
              <footer className="flex justify-end gap-2 px-1 pt-3 pb-0.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setRestartOpen(false)}
                >
                  Not now
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => void window.api.app.relaunch()}
                >
                  Restart now
                </Button>
              </footer>
            </SquircleSurface>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
