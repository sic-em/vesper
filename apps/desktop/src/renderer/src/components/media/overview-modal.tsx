import { Dialog } from '@base-ui/react/dialog'

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
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[70vh] w-[min(560px,90vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#141414]/95 p-6 backdrop-blur-xl"
          aria-label={title}
        >
          <h2 className="shrink-0 text-[17px] leading-tight font-bold tracking-[-0.01em] text-text">
            {title}
          </h2>
          <p className="scroll-hide mt-3 overflow-y-auto text-[14px] leading-[1.6] font-medium text-text-secondary">
            {overview}
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
