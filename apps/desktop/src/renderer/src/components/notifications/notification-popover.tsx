import { useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { IconButton } from '@renderer/components/ui/icon-button'
import { BellIcon } from '@renderer/components/icons'
import { NotificationRow } from './notification-row'
import { resolveStream } from '@renderer/lib/streams'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { squircleStyle } from '@renderer/components/ui/squircle-surface'

interface NotifData {
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

export function NotificationPopover(): React.JSX.Element {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const notifs = useQuery(api.notifications.listRecent) as NotifData[] | undefined
  const unread = useQuery(api.notifications.unreadCount) ?? 0
  const markAllRead = useMutation(api.notifications.markAllRead)
  const navigate = useNavigate()

  const goAll = (): void => {
    setOpen(false)
    navigate({ to: '/notifications' })
  }

  const navigateForRow = (n: NotifData): (() => void) => {
    return (): void => {
      setOpen(false)
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

  const loading = notifs === undefined
  const empty = !loading && notifs.length === 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Trigger
        render={
          <IconButton
            ref={anchorRef}
            variant="ghost"
            size="md"
            aria-label="Notifications"
            className="relative"
          >
            <BellIcon className="size-5" />
            {unread > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FF5F57]" />
            ) : null}
          </IconButton>
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
          <Popover.Popup
            className="flex w-[360px] flex-col overflow-hidden border border-white/[0.06] bg-surface-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] outline-none"
            style={squircleStyle('frame-sm')}
          >
            <Header unread={unread} canMarkAll={unread > 0} onMarkAll={() => markAllRead()} />
            <div className="flex-1">
              {loading ? <SkeletonList /> : null}
              {empty ? <EmptyBody /> : null}
              {!loading && !empty ? (
                <div className="scroll-hide max-h-[400px] overflow-y-auto">
                  {notifs.map((n) => (
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
                  ))}
                </div>
              ) : null}
            </div>
            <Footer empty={empty} onSeeAll={goAll} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Header({
  unread,
  canMarkAll,
  onMarkAll
}: {
  unread: number
  canMarkAll: boolean
  onMarkAll: () => void
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[14px] leading-[1.2] font-bold text-text">Notifications</span>
        {unread > 0 ? (
          <span className="rounded-md bg-[#FF5F57] px-1.5 py-px text-[11px] leading-[1.3] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onMarkAll}
        disabled={!canMarkAll}
        className="text-[12px] font-medium text-text-tertiary outline-none disabled:opacity-40"
      >
        Mark all read
      </button>
    </div>
  )
}

function SkeletonList(): React.JSX.Element {
  return (
    <div className="flex flex-col">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2.5 px-4 py-3">
          <div className="size-9 shrink-0 rounded-md bg-surface-3" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-2.5 w-[90%] rounded-sm bg-surface-3" />
            <div className="h-2 w-[40%] rounded-sm bg-[#1F1F1F]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Footer({ empty, onSeeAll }: { empty: boolean; onSeeAll: () => void }): React.JSX.Element {
  if (empty) {
    return (
      <div className="border-t border-white/[0.06] px-4 py-3 text-center">
        <span className="text-[12px] font-medium text-text-muted">Notification settings</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onSeeAll}
      className="w-full border-t border-white/[0.06] px-4 py-3 text-center text-[12px] font-medium text-text outline-none"
    >
      See all
    </button>
  )
}

function EmptyBody(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16">
      <div className="flex size-14 items-center justify-center rounded-[14px] bg-surface-3">
        <BellIcon className="size-6 text-text-muted" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[14px] leading-[1.2] font-bold text-text">
          You&apos;re all caught up
        </span>
        <span className="max-w-[240px] text-center text-[12px] font-medium text-text-muted">
          New episodes, friend activity, and recommendations will show up here.
        </span>
      </div>
    </div>
  )
}
