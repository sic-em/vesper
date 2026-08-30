import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { cn } from '@renderer/lib/cn'

export const TooltipProvider = BaseTooltip.Provider
export const Tooltip = BaseTooltip.Root
export const TooltipTrigger = BaseTooltip.Trigger

interface TooltipContentProps extends React.ComponentProps<typeof BaseTooltip.Popup> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function TooltipContent({
  className,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps): React.JSX.Element {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[100]">
        <BaseTooltip.Popup
          className={cn(
            'pointer-events-none rounded-md bg-surface-3 px-2 py-1 text-[12px] leading-4 font-medium text-text shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
            className
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}
