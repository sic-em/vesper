import { useEffect, useRef, useState } from 'react'
import { CloseIcon, SearchIcon } from '@renderer/components/icons'
import { cn } from '@renderer/lib/cn'

interface Props {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  expandedWidth?: number
}

/**
 * Search affordance that lives as a 36px icon button and expands into an input.
 * Collapses on Escape, or on blur when empty — so "collapsed" always means an
 * empty query. Width tween uses the shared resize curve (see CLAUDE.md §10).
 */
export function ExpandingSearch({
  value,
  onValueChange,
  placeholder = 'Search',
  expandedWidth = 220
}: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  const collapse = (): void => {
    onValueChange('')
    setExpanded(false)
  }

  return (
    <div
      className="flex h-8 shrink-0 items-center overflow-hidden rounded-full bg-overlay-soft transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: expanded ? expandedWidth : 32 }}
    >
      <button
        type="button"
        aria-label={placeholder}
        aria-expanded={expanded}
        onClick={() => (expanded ? inputRef.current?.focus() : setExpanded(true))}
        className="grid size-8 shrink-0 place-items-center text-text outline-none transition-opacity active:opacity-70"
      >
        <SearchIcon className="size-4" />
      </button>
      <input
        ref={inputRef}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        tabIndex={expanded ? 0 : -1}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            collapse()
            inputRef.current?.blur()
          }
        }}
        onBlur={(e) => {
          // Keep open when focus moves to the clear button inside the pill.
          if (!value && !e.currentTarget.parentElement?.contains(e.relatedTarget)) {
            setExpanded(false)
          }
        }}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-[13px] font-medium text-text outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:appearance-none',
          !expanded && 'pointer-events-none'
        )}
      />
      {expanded && value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onValueChange('')
            inputRef.current?.focus()
          }}
          className="grid size-8 shrink-0 place-items-center text-text-tertiary outline-none transition-opacity hover:text-text active:opacity-70"
        >
          <CloseIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
