import { Dialog } from '@base-ui/react/dialog'
import { SquircleSurface } from '@renderer/components/ui/squircle-surface'

interface OverviewModalProps {
  title: string
  overview: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OverviewModal({
  title,
  overview,
  open,
  onOpenChange
}: OverviewModalProps): React.JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          className="fixed top-1/2 left-1/2 z-50 w-[min(560px,90vw)] -translate-x-1/2 -translate-y-1/2 outline-none"
          aria-label={title}
        >
          <SquircleSurface
            variant="frame"
            className="max-h-[70vh] p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
          >
            <h2 className="shrink-0 pt-1.5 pb-2 pl-2.5 text-[15px] leading-4 font-medium tracking-[-0.01em] text-text">
              {title}
            </h2>
            <SquircleSurface variant="inset" className="min-h-0 overflow-hidden">
              <p className="scroll-hide overflow-y-auto px-4 py-3.5 text-[14px] leading-[1.6] font-medium text-text-secondary">
                {overview}
              </p>
            </SquircleSurface>
          </SquircleSurface>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
