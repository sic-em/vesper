import { Menu } from '@base-ui/react/menu'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { Avatar } from '@renderer/components/ui/avatar'
import { SettingsIcon, SignOutIcon, UserGroupIcon, UserIcon } from '@renderer/components/icons'

export function UserMenu(): React.JSX.Element {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const data = useQuery(api.profiles.me)
  const profile = data?.profile ?? null
  const user = data?.user ?? null
  const displayName = profile?.displayName ?? user?.name ?? 'Account'
  const username = profile?.username ?? null
  const seed = username ?? user?.email ?? 'vesper'
  const avatarSrc = profile?.avatarUrl

  const handleSignOut = async (): Promise<void> => {
    await signOut()
    navigate({ to: '/signin' })
  }

  const goProfile = (): void => {
    if (!username) return
    navigate({ to: '/user/$username', params: { username } })
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account menu"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-transparent outline-none"
      >
        <Avatar size="md" alt={displayName} seed={seed} src={avatarSrc} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
          <Menu.Popup className="flex w-[260px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex-col rounded-xl bg-surface-2 p-1 outline-none">
            <button
              type="button"
              onClick={goProfile}
              className="flex items-center gap-3 rounded-lg bg-transparent px-3 py-2.5 text-left outline-none transition-colors hover:bg-white/[0.06]"
            >
              <Avatar size="md" alt={displayName} seed={seed} src={avatarSrc} className="size-10" />
              <div className="flex min-w-0 flex-col">
                <span className="line-clamp-1 text-[14px] leading-5 font-semibold text-text">
                  {displayName}
                </span>
                {username ? (
                  <span className="line-clamp-1 text-[12px] leading-4 font-medium text-text-tertiary">
                    @{username}
                  </span>
                ) : null}
              </div>
            </button>
            <Menu.Separator className="my-1 h-px bg-white/[0.06]" />
            <Item icon={<UserIcon className="size-4" />} onClick={goProfile}>
              View profile
            </Item>
            <Item
              icon={<UserGroupIcon className="size-4" />}
              onClick={() => navigate({ to: '/friends' })}
            >
              Friends
            </Item>
            <Item
              icon={<SettingsIcon className="size-4" />}
              onClick={() => navigate({ to: '/settings' })}
            >
              Settings
            </Item>
            <Menu.Separator className="my-1 h-px bg-white/[0.06]" />
            <Item icon={<SignOutIcon className="size-4" />} onClick={handleSignOut} tone="danger">
              Sign out
            </Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

interface ItemProps {
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
  tone?: 'default' | 'danger'
}

function Item({ icon, onClick, children, tone = 'default' }: ItemProps): React.JSX.Element {
  return (
    <Menu.Item
      onClick={onClick}
      className={
        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] leading-4 font-medium outline-none transition-colors select-none data-[highlighted]:bg-white/[0.06] ' +
        (tone === 'danger' ? 'text-red-400' : 'text-text')
      }
    >
      <span className={tone === 'danger' ? 'text-red-400' : 'text-text-tertiary'}>{icon}</span>
      {children}
    </Menu.Item>
  )
}
