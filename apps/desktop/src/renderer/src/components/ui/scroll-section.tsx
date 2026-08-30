import { useRef } from 'react'
import { cn } from '@renderer/lib/cn'
import { SectionTitle } from './section-title'
import { ScrollChevrons } from './scroll-chevrons'

interface Props {
  title: React.ReactNode
  children: React.ReactNode
  gapClass?: string
  titleAside?: React.ReactNode
}

export function ScrollSection({
  title,
  children,
  gapClass = 'gap-3',
  titleAside
}: Props): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <section className="flex flex-col gap-4">
      {titleAside ? (
        <div className="flex items-center justify-between px-6">
          <SectionTitle>{title}</SectionTitle>
          {titleAside}
        </div>
      ) : (
        <SectionTitle className="px-6">{title}</SectionTitle>
      )}
      <div className="group relative">
        <div ref={scrollRef} className={cn('scroll-hide flex overflow-x-auto pl-6', gapClass)}>
          {children}
        </div>
        <ScrollChevrons scrollRef={scrollRef} />
      </div>
    </section>
  )
}
