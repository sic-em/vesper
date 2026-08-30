import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/cn'

const trackVariants = cva('relative overflow-hidden rounded-[2px]', {
  variants: {
    tone: {
      dark: 'bg-surface-3',
      light: 'bg-white/25'
    },
    size: {
      sm: 'h-[3px]',
      md: 'h-1'
    }
  },
  defaultVariants: { tone: 'dark', size: 'sm' }
})

type ProgressBarProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof trackVariants> & {
    value: number
    ref?: React.Ref<HTMLDivElement>
  }

export function ProgressBar({
  className,
  tone,
  size,
  value,
  ref,
  ...props
}: ProgressBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(trackVariants({ tone, size }), className)}
      {...props}
    >
      <div className="h-full rounded-[2px] bg-white" style={{ width: `${clamped}%` }} />
    </div>
  )
}
