import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { cn } from '@renderer/lib/cn'
import { NotificationRow } from '@renderer/components/notifications/notification-row'
import { resolveStream } from '@renderer/lib/streams'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage
})

type NotifData = {
  _id: Id<'notifications'>
  kind:
    | 'friend_request'
    | 'friend_accept'
    | 'collab_invite'
    | 'collab_accept'
    | 'list_removed'
    | 'new_episode'
    | 'new_season'
    | 'stream_ready'
    | 'stream_failed'
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
}

function NotificationsPage(): React.JSX.Element {
  const notifs = useQuery(api.notifications.listRecent) as NotifData[] | undefined
  const unread = useQuery(api.notifications.unreadCount) ?? 0
  const markAllRead = useMutation(api.notifications.markAllRead)
  const navigate = useNavigate()

  const navigateForRow = (n: NotifData): (() => void) => {
    return (): void => {
      if (n.kind === 'friend_request' || n.kind === 'friend_accept') {
        if (n.actor?.username) {
          navigate({ to: '/user/$username', params: { username: n.actor.username } })
        }
        return
      }
      if (n.kind === 'collab_invite' || n.kind === 'collab_accept') {
        if (n.listId) navigate({ to: '/list/$id', params: { id: n.listId } })
        return
      }
      if (n.kind === 'list_removed') return
      if (n.tmdbId && (n.kind === 'new_episode' || n.kind === 'new_season')) {
        navigate({ to: '/tv/$id', params: { id: String(n.tmdbId) } })
        return
      }
      if (n.kind === 'stream_ready') {
        if (!n.imdbId || !n.playbackHash || !n.mediaType || n.tmdbId === undefined) return
        const mediaType = n.mediaType
        void (async () => {
          try {
            const url = await resolveStream({
              type: mediaType === 'tv' ? 'series' : 'movie',
              imdbId: n.imdbId!,
              season: n.season,
              episode: n.episode,
              tmdbId: n.tmdbId,
              playbackHash: n.playbackHash!
            })
            navigate({
              to: '/watch/$mediaType/$id',
              params: { mediaType, id: String(n.tmdbId) },
              search: {
                url,
                title: n.title ?? '',
                imdbId: n.imdbId!,
                mediaType,
                season: n.season,
                episode: n.episode,
                episodeLabel: n.season && n.episode ? `S${n.season}E${n.episode}` : undefined
              }
            })
          } catch (e) {
            console.error('[notif] play failed', e)
          }
        })()
        return
      }
      if (n.kind === 'stream_failed' && n.tmdbId) {
        navigate({
          to: n.mediaType === 'tv' ? '/tv/$id' : '/movie/$id',
          params: { id: String(n.tmdbId) }
        })
      }
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 px-6 pt-5 pb-8">
      <header className="flex items-center justify-between">
        <h1 className="text-[24px] leading-tight font-bold tracking-[-0.02em] text-text">
          Notifications
        </h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => markAllRead()}
            disabled={unread === 0}
            className="text-[13px] font-medium text-text-tertiary outline-none disabled:opacity-40"
          >
            Mark all read
          </button>
          <ClearAllButton disabled={!notifs || notifs.length === 0} />
        </div>
      </header>
      <div className="flex flex-col overflow-hidden rounded-xl bg-surface">
        {notifs === undefined ? (
          <div className="px-4 py-8 text-center text-[13px] text-text-muted">Loading…</div>
        ) : notifs.length === 0 ? (
          <div className="px-4 py-16 text-center text-[13px] text-text-muted">
            You&apos;re all caught up.
          </div>
        ) : (
          notifs.map((n) => (
            <NotificationRow
              key={n._id}
              notificationId={n._id}
              kind={n.kind}
              friendshipId={n.friendshipId}
              actor={n.actor}
              listId={n.listId}
              listName={n.listName}
              tmdbId={n.tmdbId}
              mediaType={n.mediaType}
              season={n.season}
              episode={n.episode}
              title={n.title}
              posterPath={n.posterPath}
              imdbId={n.imdbId}
              playbackHash={n.playbackHash}
              readAt={n.readAt}
              createdAt={n.createdAt}
              onNavigate={navigateForRow(n)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ClearAllButton({ disabled }: { disabled: boolean }): React.JSX.Element {
  const clearAll = useMutation(api.notifications.clearAll)
  const [confirm, setConfirm] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const onClick = (): void => {
    if (!confirm) {
      setConfirm(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setConfirm(false), 3000)
      return
    }
    if (timer.current) clearTimeout(timer.current)
    setConfirm(false)
    void clearAll()
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-[13px] font-medium outline-none transition-colors disabled:opacity-40',
        confirm ? 'text-red-400' : 'text-text-tertiary'
      )}
    >
      {confirm ? 'Confirm?' : 'Clear all'}
    </button>
  )
}
