import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { cn } from '@renderer/lib/cn'

interface Props {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className
}: Props): React.JSX.Element {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-[22px] w-[36px] shrink-0 items-center rounded-full bg-white/[0.12] outline-none transition-colors data-[checked]:bg-white disabled:opacity-40',
        className
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          'pointer-events-none block size-[18px] translate-x-0.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-transform data-[checked]:translate-x-[16px] data-[checked]:bg-black'
        )}
      />
    </BaseSwitch.Root>
  )
}
