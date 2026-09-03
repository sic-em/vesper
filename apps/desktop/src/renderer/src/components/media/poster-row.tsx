import { useNavigate } from '@tanstack/react-router'
import { PosterCard } from './poster-card'
import { ScrollSection } from '@renderer/components/ui/scroll-section'
import { MediaContextMenu } from '@renderer/components/library/media-context-menu'

export interface PosterRowItem {
  id: number
  title: string
  poster: string
  posterPath?: string
  type?: 'movie' | 'tv'
}

interface PosterRowProps {
  title: string
  items: PosterRowItem[]
  max?: number
  contextMenu?: boolean
}

export function PosterRow({
  title,
  items,
  max = 12,
  contextMenu = true
}: PosterRowProps): React.JSX.Element {
  const navigate = useNavigate()
  const open = (item: PosterRowItem): void => {
    if (item.type === 'movie') {
      navigate({ to: '/movie/$id', params: { id: String(item.id) }, viewTransition: false })
    } else if (item.type === 'tv') {
      navigate({ to: '/tv/$id', params: { id: String(item.id) }, viewTransition: false })
    }
  }
  return (
    <ScrollSection title={title}>
      {items.slice(0, max).map((item) => {
        const card = (
          <PosterCard
            title={item.title}
            poster={item.poster}
            onClick={item.type ? () => open(item) : undefined}
            preload={
              item.type
                ? {
                    to: item.type === 'movie' ? '/movie/$id' : '/tv/$id',
                    params: { id: String(item.id) }
                  }
                : null
            }
          />
        )
        if (!item.type || !contextMenu) return <div key={item.id}>{card}</div>
        return (
          <MediaContextMenu
            key={item.id}
            mediaType={item.type}
            tmdbId={item.id}
            title={item.title}
            posterPath={item.posterPath}
          >
            {card}
          </MediaContextMenu>
        )
      })}
    </ScrollSection>
  )
}
