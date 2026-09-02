import { useMutation } from 'convex/react'
import dayjs from 'dayjs'
import { Avatar } from '@renderer/components/ui/avatar'
import { tmdbImage } from '@renderer/lib/tmdb'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

type NotifKind =
  | 'friend_request'
  | 'friend_accept'
  | 'collab_invite'
  | 'collab_accept'
  | 'list_removed'
  | 'new_episode'
  | 'new_season'
  | 'stream_ready'
  | 'stream_failed'

export interface NotificationRowProps {
  notificationId: Id<'notifications'>
  kind: NotifKind
  friendshipId?: Id<'friendships'>
  actor?: { userId: Id<'users'>; displayName: string; username: string; avatarUrl?: string }
  listId?: Id<'lists'>
  listName?: string
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
  season?: number
  episode?: number
  title?: string
  posterPath?: string
  imdbId?: string
  playbackHash?: string
  readAt?: number
  createdAt: number
  onNavigate: () => void
}

function timeAgo(ts: number): string {
  return dayjs(ts).fromNow(true) + ' ago'
}

function VideoClipIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M3.75 12H7.75M3.75 12V7.875M3.75 12V16.125M7.75 12H16.25M7.75 12V16.125M7.75 12V7.875M16.25 12H20.25M16.25 12V16.5833M16.25 12V7.875M20.25 12V7.875M20.25 12V16.5833M16.25 20.25H18.25C19.3546 20.25 20.25 19.3546 20.25 18.25V16.5833M16.25 20.25V16.5833M16.25 20.25H7.75M16.25 3.75H18.25C19.3546 3.75 20.25 4.64543 20.25 5.75V7.875M16.25 3.75V7.875M16.25 3.75H7.75M16.25 7.875H20.25M16.25 16.5833H20.25M7.75 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25V16.125M7.75 20.25V16.125M7.75 3.75H5.75C4.64543 3.75 3.75 4.64543 3.75 5.75V7.875M7.75 3.75V7.875M3.75 7.875H7.75M3.75 16.125H7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function bodyText(p: NotificationRowProps): string {
  switch (p.kind) {
    case 'friend_request':
      return `${p.actor?.displayName ?? 'Someone'} sent you a friend request`
    case 'friend_accept':
      return `${p.actor?.displayName ?? 'Someone'} accepted your friend request`
    case 'collab_invite':
      return `${p.actor?.displayName ?? 'Someone'} invited you to collaborate on ${p.listName ?? 'a list'}`
    case 'collab_accept':
      return `${p.actor?.displayName ?? 'Someone'} joined ${p.listName ?? 'your list'}`
    case 'list_removed':
      return `${p.actor?.displayName ?? 'The owner'} removed ${p.listName ?? 'a list'} you collaborated on`
    case 'new_episode':
      return `New episode of ${p.title ?? 'a show'}${p.season && p.episode ? ` S${p.season}E${p.episode}` : ''} is ready`
    case 'new_season':
      return `${p.title ?? 'A show'}${p.season ? ` Season ${p.season}` : ''} just dropped`
    case 'stream_ready':
      return `${p.title ?? 'Your stream'}${p.season && p.episode ? ` S${p.season}E${p.episode}` : ''} is ready to play`
    case 'stream_failed':
      return `Couldn't get ${p.title ?? 'that stream'}${p.season && p.episode ? ` S${p.season}E${p.episode}` : ''} ready`
  }
}

export function NotificationRow(props: NotificationRowProps): React.JSX.Element {
  const markRead = useMutation(api.notifications.markRead)
  const acceptFriend = useMutation(api.friendships.acceptRequest)
  const declineFriend = useMutation(api.friendships.declineRequest)
  const friendActionable = props.kind === 'friend_request' && !!props.friendshipId

  const handleClick = (): void => {
    if (!props.readAt) void markRead({ notificationId: props.notificationId })
    props.onNavigate()
  }

  const handleAccept = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (props.kind === 'friend_request' && props.friendshipId) {
      await acceptFriend({ friendshipId: props.friendshipId })
    }
  }

  const handleDecline = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (props.kind === 'friend_request' && props.friendshipId) {
      await declineFriend({ friendshipId: props.friendshipId })
    }
  }

  const thumb = renderThumb(props)
  const unread = !props.readAt

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full flex-col gap-2.5 px-4 py-3 text-left outline-none"
    >
      <div className="flex items-start gap-2.5">
        {thumb}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13px] leading-[1.4] font-medium text-text">{bodyText(props)}</span>
          <span className="text-[12px] leading-4 font-medium text-text-muted">
            {timeAgo(props.createdAt)}
          </span>
        </div>
        {unread ? (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#FF5F57]" aria-label="Unread" />
        ) : null}
      </div>
      {friendActionable ? (
        <div className="flex gap-2 pl-[46px]">
          <button
            type="button"
            onClick={handleAccept}
            className="flex h-8 flex-1 items-center justify-center rounded-md bg-white text-[12px] font-bold text-black outline-none"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="flex h-8 flex-1 items-center justify-center rounded-md bg-surface-3 text-[12px] font-bold text-text outline-none"
          >
            Decline
          </button>
        </div>
      ) : null}
    </button>
  )
}

function renderThumb(p: NotificationRowProps): React.ReactNode {
  if (
    p.kind === 'new_episode' ||
    p.kind === 'new_season' ||
    p.kind === 'collab_invite' ||
    p.kind === 'stream_ready' ||
    p.kind === 'stream_failed'
  ) {
    if (p.posterPath) {
      return (
        <div
          className="size-9 shrink-0 rounded-md bg-cover bg-center bg-surface-3"
          style={{ backgroundImage: `url(${tmdbImage(p.posterPath, 'w154')})` }}
        />
      )
    }
    if (p.kind === 'stream_ready' || p.kind === 'stream_failed') {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-3">
          <VideoClipIcon className="size-4 text-text-muted" />
        </div>
      )
    }
    return <div className="size-9 shrink-0 rounded-md bg-surface-3" />
  }
  const seed = p.actor?.username ?? p.actor?.displayName ?? 'user'
  return (
    <Avatar
      size="md"
      className="size-9"
      alt={p.actor?.displayName ?? ''}
      seed={seed}
      src={p.actor?.avatarUrl}
    />
  )
}
