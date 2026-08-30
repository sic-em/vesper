import { useState } from 'react'
import { useMutation } from 'convex/react'
import {
  ContextMenuItem,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSeparator,
  EditGlyph,
  InfoGlyph,
  PinGlyph,
  ShareGlyph,
  SignOutGlyph,
  TrashGlyph
} from '@renderer/components/ui/context-menu'
import { ListFormModal } from '@renderer/components/library/list-form-modal'
import { shareUrlForList } from '@renderer/lib/share-url'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'

interface ListContextMenuProps {
  list: Doc<'lists'> & { viewerRole?: 'owner' | 'editor' | 'viewer'; pinned?: boolean }
  onOpen?: () => void
  onDelete?: () => void
  onLeave?: () => void
  asPopover?: { open: boolean; onOpenChange: (v: boolean) => void; trigger: React.ReactNode }
  children?: React.ReactNode
}

export function ListContextMenu({
  list,
  onOpen,
  onDelete,
  onLeave,
  asPopover,
  children
}: ListContextMenuProps): React.JSX.Element {
  const [editOpen, setEditOpen] = useState(false)
  const deleteList = useMutation(api.lists.deleteList)
  const leaveList = useMutation(api.lists.leaveList)
  const pinList = useMutation(api.lists.pinList)
  const unpinList = useMutation(api.lists.unpinList)
  const role = list.viewerRole ?? 'owner'
  const isOwner = role === 'owner'
  const isEditor = role === 'editor'
  const canPin = list.kind === 'custom'
  const pinned = !!list.pinned

  const togglePin = (): void => {
    if (pinned) void unpinList({ listId: list._id as Id<'lists'> })
    else void pinList({ listId: list._id as Id<'lists'> })
  }

  const handleDelete = (): void => {
    onDelete?.()
    void deleteList({ listId: list._id as Id<'lists'> })
  }

  const handleLeave = (): void => {
    onLeave?.()
    void leaveList({ listId: list._id as Id<'lists'> })
  }

  const share = (): void => {
    if (!list.shortCode) return
    void navigator.clipboard?.writeText(shareUrlForList(list.shortCode)).catch(() => {})
  }

  const items = (
    <>
      {onOpen ? <ContextMenuItem icon={<InfoGlyph />} label="Open" onClick={onOpen} /> : null}
      {canPin ? (
        <ContextMenuItem
          icon={<PinGlyph />}
          label={pinned ? 'Unpin' : 'Pin to top'}
          onClick={togglePin}
        />
      ) : null}
      {isOwner && !list.locked ? (
        <ContextMenuItem icon={<EditGlyph />} label="Edit" onClick={() => setEditOpen(true)} />
      ) : null}
      <ContextMenuItem icon={<ShareGlyph />} label="Share" onClick={share} />
      {isOwner && !list.locked ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem icon={<TrashGlyph />} label="Delete" onClick={handleDelete} danger />
        </>
      ) : null}
      {isEditor ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            icon={<SignOutGlyph />}
            label="Leave list"
            onClick={handleLeave}
            danger
          />
        </>
      ) : null}
    </>
  )

  return (
    <>
      {asPopover ? (
        <ContextMenuPopover
          open={asPopover.open}
          onOpenChange={asPopover.onOpenChange}
          trigger={asPopover.trigger}
        >
          {items}
        </ContextMenuPopover>
      ) : (
        <ContextMenuRoot trigger={children}>{items}</ContextMenuRoot>
      )}
      {isOwner && !list.locked ? (
        <ListFormModal mode="edit" list={list} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </>
  )
}
