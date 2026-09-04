import { useId } from 'react'
import { Input } from '@base-ui/react/input'
import { cn } from '@renderer/lib/cn'
import { SearchIcon } from '@renderer/components/icons'

type SearchInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  ref?: React.Ref<HTMLInputElement>
  trailing?: React.ReactNode
}

export function SearchInput({
  className,
  ref,
  trailing,
  ...props
}: SearchInputProps): React.JSX.Element {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex h-12 w-full max-w-[560px] items-center gap-3 rounded-xl bg-surface-2 pl-4 pr-1.5',
        className
      )}
    >
      <SearchIcon className="size-[18px] shrink-0 text-text-muted" />
      <Input
        id={id}
        ref={ref}
        placeholder="What do you want to watch?"
        aria-label="Search"
        className="placeholder:text-text-muted h-full flex-1 bg-transparent text-[13px] leading-4 font-medium text-text outline-none"
        {...props}
      />
      {trailing}
    </label>
  )
}
