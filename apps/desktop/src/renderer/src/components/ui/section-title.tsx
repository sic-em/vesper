import type { HTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

export function SectionTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  return (
    <h2
      className={cn(
        'text-[18px] leading-[22px] font-semibold tracking-[-0.01em] text-text',
        className
      )}
      {...props}
    />
  )
}
