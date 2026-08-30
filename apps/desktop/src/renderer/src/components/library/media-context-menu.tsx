import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ListCover } from '@renderer/components/library/list-cover'
import { ListFormModal } from '@renderer/components/library/list-form-modal'
import {
  CheckGlyph,
  ContextMenuItem,
  ContextMenuListRow,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSubmenu,
  InfoGlyph,
  PlayGlyph,
  PlusGlyph,
  ShareGlyph,
  TrashGlyph
} from '@renderer/components/ui/context-menu'
import { tmdbImage } from '@renderer/lib/tmdb'
import { shareUrlForMovie, shareUrlForTv } from '@renderer/lib/share-url'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

interface MediaContextMenuProps {
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  posterPath?: string
  onPlay?: () => void
  onRemove?: () => void
  removeLabel?: string
  children: React.ReactNode
}

export function MediaContextMenu({
  mediaType,
  tmdbId,
  title,
  posterPath,
  onPlay,
  onRemove,
  removeLabel,
  children
}: MediaContextMenuProps): React.JSX.Element {
  const navigate = useNavigate()
  const [newListOpen, setNewListOpen] = useState(false)

  const goDetails = (): void => {
    navigate({
      to: mediaType === 'movie' ? '/movie/$id' : '/tv/$id',
      params: { id: String(tmdbId) },
      viewTransition: false
    })
  }

  const play = (): void => {
    if (onPlay) {
      onPlay()
      return
    }
    navigate({
      to: mediaType === 'movie' ? '/movie/$id' : '/tv/$id',
      params: { id: String(tmdbId) },
      search: { play: true },
      viewTransition: false
    })
  }

  const share = (): void => {
    const url = mediaType === 'movie' ? shareUrlForMovie(tmdbId) : shareUrlForTv(tmdbId)
    void navigator.clipboard?.writeText(url).catch(() => {})
  }

  return (
    <>
      <ContextMenuRoot trigger={children}>
        <ContextMenuItem icon={<PlayGlyph />} label="Play" onClick={play} />
        <ContextMenuSubmenu icon={<PlusGlyph />} label="Add to List">
          <ListsSubmenuBody
            mediaType={mediaType}
            tmdbId={tmdbId}
            title={title}
            posterPath={posterPath}
            onNewList={() => setNewListOpen(true)}
          />
        </ContextMenuSubmenu>
        <WatchedMenuItem
          mediaType={mediaType}
          tmdbId={tmdbId}
          title={title}
          posterPath={posterPath}
        />
        <ContextMenuItem icon={<ShareGlyph />} label="Share" onClick={share} />
        <ContextMenuSeparator />
        <ContextMenuItem icon={<InfoGlyph />} label="Details" onClick={goDetails} />
        {onRemove ? (
          <ContextMenuItem
            icon={<TrashGlyph />}
            label={removeLabel ?? 'Remove'}
            onClick={onRemove}
            danger
          />
        ) : null}
      </ContextMenuRoot>
      <ListFormModal mode="new" open={newListOpen} onOpenChange={setNewListOpen} />
    </>
  )
}

export function ListsSubmenuBody({
  mediaType,
  tmdbId,
  title,
  posterPath,
  onNewList
}: {
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  posterPath?: string
  onNewList: () => void
}): React.JSX.Element {
  const lists = useQuery(api.lists.myLists)
  const membership = useQuery(api.lists.membership, { mediaType, tmdbId })
  const setMembership = useMutation(api.lists.setMembership)

  const memberSet = new Set(membership ?? [])

  const toggle = (listId: Id<'lists'>): void => {
    const next = new Set(memberSet)
    if (next.has(listId)) next.delete(listId)
    else next.add(listId)
    void setMembership({
      mediaType,
      tmdbId,
      title,
      posterPath,
      listIds: Array.from(next)
    })
  }

  return (
    <>
      <ContextMenuItem icon={<PlusGlyph />} label="New List…" onClick={onNewList} />
      {lists === undefined ? (
        <span className="p-2 text-[12px] text-text-tertiary">Loading…</span>
      ) : null}
      {lists && lists.length === 0 ? (
        <span className="p-2 text-[12px] text-text-tertiary">No lists yet</span>
      ) : null}
      {(lists ?? []).map((list) => {
        const posters = list.recentItems
          .map((i) => tmdbImage(i.posterPath, 'w154'))
          .filter(Boolean) as string[]
        const isMember = memberSet.has(list._id as Id<'lists'>)
        return (
          <ContextMenuListRow
            key={list._id}
            thumb={
              <ListCover
                kind={list.kind}
                posters={posters}
                seed={list._id}
                size="sm"
                name={list.name}
              />
            }
            label={list.name}
            onClick={() => toggle(list._id as Id<'lists'>)}
            trailing={isMember ? <CheckGlyph /> : null}
          />
        )
      })}
    </>
  )
}

function WatchedMenuItem({
  mediaType,
  tmdbId,
  title,
  posterPath
}: {
  mediaType: 'movie' | 'tv'
  tmdbId: number
  title: string
  posterPath?: string
}): React.JSX.Element {
  const watched = useQuery(api.lists.isWatched, { mediaType, tmdbId })
  const mark = useMutation(api.lists.markWatched)
  const unmark = useMutation(api.lists.unmarkWatched)
  const isOn = watched === true
  return (
    <ContextMenuItem
      icon={<CheckGlyph />}
      label={isOn ? 'Unmark as watched' : 'Mark as watched'}
      onClick={() => {
        if (isOn) void unmark({ mediaType, tmdbId })
        else void mark({ mediaType, tmdbId, title, posterPath })
      }}
    />
  )
}
