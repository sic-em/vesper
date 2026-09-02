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
  TrashGlyph
} from '@renderer/components/ui/context-menu'
import { ListFormModal } from '@renderer/components/library/list-form-modal'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'

interface ListContextMenuProps {
  list: Doc<'lists'> & { pinned?: boolean }
  onOpen?: () => void
  onDelete?: () => void
  asPopover?: { open: boolean; onOpenChange: (v: boolean) => void; trigger: React.ReactNode }
  children?: React.ReactNode
}

export function ListContextMenu({
  list,
  onOpen,
  onDelete,
  asPopover,
  children
}: ListContextMenuProps): React.JSX.Element {
  const [editOpen, setEditOpen] = useState(false)
  const deleteList = useMutation(api.lists.deleteList)
  const pinList = useMutation(api.lists.pinList)
  const unpinList = useMutation(api.lists.unpinList)
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
      {!list.locked ? (
        <>
          <ContextMenuItem icon={<EditGlyph />} label="Edit" onClick={() => setEditOpen(true)} />
          <ContextMenuSeparator />
          <ContextMenuItem icon={<TrashGlyph />} label="Delete" onClick={handleDelete} danger />
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
      {!list.locked ? (
        <ListFormModal mode="edit" list={list} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </>
  )
}
