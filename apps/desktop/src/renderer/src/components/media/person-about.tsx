import { useState } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { SectionTitle } from '@renderer/components/ui/section-title'

const EXPAND_THRESHOLD = 200

export function PersonAbout({ bio }: { bio: string }): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  if (!bio) return null
  const expandable = bio.length > EXPAND_THRESHOLD
  return (
    <section className="flex flex-col gap-3 px-6">
      <SectionTitle>About</SectionTitle>
      <p
        className={
          'text-[13px] leading-[1.55] font-medium text-text-secondary ' +
          (open || !expandable ? '' : 'line-clamp-2')
        }
      >
        {bio}
      </p>
      {expandable ? (
        <BaseButton
          onClick={() => setOpen((v) => !v)}
          className="self-start bg-transparent text-[12px] leading-4 font-semibold text-text-tertiary outline-none transition-opacity active:opacity-70"
        >
          {open ? 'Read less' : 'Read more'}
        </BaseButton>
      ) : null}
    </section>
  )
}
