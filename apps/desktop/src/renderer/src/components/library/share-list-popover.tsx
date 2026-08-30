import { useEffect, useMemo, useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Switch } from '@base-ui/react/switch'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, m as motion } from 'motion/react'
import { Avatar } from '@renderer/components/ui/avatar'
import { cn } from '@renderer/lib/cn'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

interface Member {
  userId: Id<'users'>
  username: string
  displayName: string
  avatarUrl?: string
}

interface Owner {
  userId: Id<'users'>
  username: string
  displayName: string
  avatarUrl?: string
}

interface ListLite {
  _id: Id<'lists'>
  name: string
  shortCode?: string
  joinCode?: string
  owner: Owner | null
  members: Member[]
  viewerRole: 'owner' | 'editor' | 'viewer'
}

interface ShareListPopoverProps {
  list: ListLite
  children: React.ReactNode
}

export function ShareListPopover({ list, children }: ShareListPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const friendsQuery = useQuery(api.friendships.listAccepted)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger render={children as React.ReactElement} />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
          <Popover.Popup className="flex w-[360px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex-col overflow-hidden rounded-xl bg-surface-2 outline-none">
            {open ? <Body list={list} friendsQuery={friendsQuery} /> : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

type FriendsResult = ReturnType<typeof useQuery<typeof api.friendships.listAccepted>>

function Body({
  list,
  friendsQuery
}: {
  list: ListLite
  friendsQuery: FriendsResult
}): React.JSX.Element {
  const friendsLoading = friendsQuery === undefined
  const friends = friendsQuery ?? []
  const inviteMut = useMutation(api.lists.invite)
  const kickMut = useMutation(api.lists.kickMember)
  const setJoinLink = useMutation(api.lists.setJoinLink)
  const regenerateJoinLink = useMutation(api.lists.regenerateJoinLink)
  const [pendingInvite, setPendingInvite] = useState<Set<string>>(new Set())
  const [linkBusy, setLinkBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenConfirm, setRegenConfirm] = useState(false)
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
    }
  }, [])

  const memberIds = useMemo(() => new Set(list.members.map((m) => m.userId)), [list.members])
  const availableFriends = friends.filter((f) => !memberIds.has(f.userId))

  const joinEnabled = !!list.joinCode
  const joinUrl =
    list.shortCode && list.joinCode
      ? `https://vespr.dev/list/${list.shortCode}/join/${list.joinCode}`
      : ''
  const lastJoinUrlRef = useRef(joinUrl)
  if (joinUrl) lastJoinUrlRef.current = joinUrl
  const displayJoinUrl = joinUrl || lastJoinUrlRef.current

  const invite = async (friendUserId: Id<'users'>): Promise<void> => {
    setPendingInvite((prev) => new Set(prev).add(friendUserId))
    try {
      await inviteMut({ listId: list._id, friendUserId })
    } catch {
      setPendingInvite((prev) => {
        const next = new Set(prev)
        next.delete(friendUserId)
        return next
      })
    }
  }

  const kick = async (memberUserId: Id<'users'>): Promise<void> => {
    await kickMut({ listId: list._id, memberUserId })
  }

  const toggleJoinLink = async (enabled: boolean): Promise<void> => {
    if (linkBusy) return
    setLinkBusy(true)
    try {
      await setJoinLink({ listId: list._id, enabled })
    } finally {
      setLinkBusy(false)
    }
  }

  const copyJoinUrl = async (): Promise<void> => {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onRegenClick = async (): Promise<void> => {
    if (!regenConfirm) {
      setRegenConfirm(true)
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
      regenTimerRef.current = setTimeout(() => setRegenConfirm(false), 3000)
      return
    }
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current)
    setRegenConfirm(false)
    await regenerateJoinLink({ listId: list._id })
  }

  return (
    <div className="flex max-h-[480px] flex-col">
      <header className="border-b border-white/[0.06] px-4 py-3">
        <h2 className="truncate text-[13px] font-bold text-text">Share & collaborators</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
            Collaborators
          </h3>
          <ul className="flex flex-col gap-1.5">
            {list.owner ? (
              <MemberRow
                avatarUrl={list.owner.avatarUrl}
                displayName={list.owner.displayName}
                username={list.owner.username}
                badge="Owner"
              />
            ) : null}
            {list.members.map((m) => (
              <MemberRow
                key={m.userId}
                avatarUrl={m.avatarUrl}
                displayName={m.displayName}
                username={m.username}
                badge="Editor"
                onRemove={() => void kick(m.userId)}
              />
            ))}
          </ul>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
            Invite friends
          </h3>
          {friendsLoading ? (
            <ul className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </ul>
          ) : availableFriends.length === 0 ? (
            <p className="text-[12px] text-text-muted">
              {friends.length === 0
                ? "You don't have any friends yet."
                : 'All your friends are already collaborators.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {availableFriends.map((f) => {
                const sent = pendingInvite.has(f.userId)
                return (
                  <MemberRow
                    key={f.userId}
                    avatarUrl={f.avatarUrl}
                    displayName={f.displayName}
                    username={f.username}
                    trailing={
                      <button
                        type="button"
                        disabled={sent}
                        onClick={() => void invite(f.userId)}
                        className="flex h-7 items-center justify-center rounded-md bg-white px-3 text-[11px] font-bold text-black outline-none disabled:bg-surface-3 disabled:text-text-muted"
                      >
                        {sent ? 'Sent' : 'Invite'}
                      </button>
                    }
                  />
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
            Join link
          </h3>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-text">Anyone with the link can join</p>
              <p className="text-[11px] text-text-muted">Turn off to revoke instantly.</p>
            </div>
            <Switch.Root
              checked={joinEnabled}
              onCheckedChange={(checked: boolean) => void toggleJoinLink(checked)}
              disabled={linkBusy}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-surface-3 transition-colors data-[checked]:bg-white"
            >
              <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-text shadow transition-transform data-[checked]:translate-x-[18px] data-[checked]:bg-black" />
            </Switch.Root>
          </div>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ gridTemplateRows: joinEnabled && joinUrl ? '1fr' : '0fr' }}
            aria-hidden={!joinEnabled || !joinUrl}
          >
            <div className="overflow-hidden">
              <div className="mt-2 flex items-stretch gap-1.5">
                <button
                  type="button"
                  onClick={() => void copyJoinUrl()}
                  aria-label="Copy join link"
                  disabled={!joinEnabled}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-surface-3 px-2.5 py-2 text-left outline-none transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]"
                >
                  <span className="flex-1 truncate font-mono text-[11px] text-text">
                    {displayJoinUrl}
                  </span>
                  <span className="relative flex size-3.5 shrink-0 items-center justify-center">
                    <AnimatePresence initial={false}>
                      {copied ? (
                        <motion.svg
                          key="check"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5 text-text"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : null}
                    </AnimatePresence>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void onRegenClick()}
                  title={regenConfirm ? 'Confirm regenerate?' : 'Regenerate link'}
                  aria-label={regenConfirm ? 'Confirm regenerate link' : 'Regenerate link'}
                  disabled={!joinEnabled}
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-md text-[11px] font-medium outline-none transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
                    regenConfirm
                      ? 'bg-red-500/15 px-2.5 text-red-400'
                      : 'w-9 bg-surface-3 text-text'
                  )}
                >
                  {regenConfirm ? 'Confirm' : <RefreshGlyph className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function SkeletonRow(): React.JSX.Element {
  return (
    <li className="flex items-center gap-2.5">
      <span className="size-8 shrink-0 rounded-full bg-surface-3" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="block h-3 w-24 rounded-sm bg-surface-3" />
        <span className="block h-2.5 w-16 rounded-sm bg-surface-3/60" />
      </div>
      <span className="h-7 w-14 shrink-0 rounded-md bg-surface-3" />
    </li>
  )
}

function MemberRow({
  avatarUrl,
  displayName,
  username,
  badge,
  onRemove,
  trailing
}: {
  avatarUrl?: string
  displayName: string
  username: string
  badge?: string
  onRemove?: () => void
  trailing?: React.ReactNode
}): React.JSX.Element {
  return (
    <li className="group flex items-center gap-2.5">
      <Avatar size="md" src={avatarUrl} seed={username} alt={displayName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] font-medium text-text">{displayName}</span>
        <span className="truncate text-[11px] text-text-muted">@{username}</span>
      </div>
      {badge ? (
        onRemove ? (
          <>
            <span className="text-[10px] font-medium text-text-tertiary group-hover:hidden">
              {badge}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="hidden text-[11px] font-medium text-red-400 outline-none group-hover:inline"
            >
              Remove
            </button>
          </>
        ) : (
          <span className="text-[10px] font-medium text-text-tertiary">{badge}</span>
        )
      ) : null}
      {trailing}
    </li>
  )
}

function RefreshGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
