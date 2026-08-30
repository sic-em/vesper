import { useEffect, useState } from 'react'
import { IconButton } from '@renderer/components/ui/icon-button'
import { SearchControl } from '@renderer/components/search/search-popover'
import { UserMenu } from '@renderer/components/layout/user-menu'
import { NotificationPopover } from '@renderer/components/notifications/notification-popover'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  SidebarLeftIcon,
  UserGroupIcon,
  WinCloseIcon,
  WinMaximizeIcon,
  WinMinimizeIcon
} from '@renderer/components/icons'
import { useNavigate } from '@tanstack/react-router'
import { isMac, isWindows } from '@renderer/lib/platform'
import { useNavState } from '@renderer/lib/use-nav-state'

const SHELL_PAD = 8 // root .px-2
const NAV_RESERVE_MAC = 78 + 24 + 4 * 32 + 3 * 8 + 16
const NAV_RESERVE_WIN = 16 + 3 * 32 + 2 * 8 + 8 // ml-4 + 3 buttons + gaps + final pad
const SEARCH_MAX = 560
const WIN_CONTROLS_WIDTH = 138 // 3 buttons × 46

export interface TopBarProps {
  leftCollapsed: boolean
  rightCollapsed: boolean
  leftWidth: number
  rightWidth: number
  onExpandLeft: () => void
  onExpandRight: () => void
  minimal?: boolean
}

export function TopBar({
  leftCollapsed,
  rightCollapsed,
  leftWidth,
  rightWidth,
  onExpandLeft,
  onExpandRight,
  minimal = false
}: TopBarProps): React.JSX.Element {
  const [winWidth, setWinWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = (): void => setWinWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const navReserve = isMac ? NAV_RESERVE_MAC : NAV_RESERVE_WIN
  const leftEff = leftCollapsed ? 0 : leftWidth
  const rightEff = rightCollapsed ? 0 : rightWidth
  const rightReserve = isWindows ? WIN_CONTROLS_WIDTH : 0
  const idealLeft = leftEff + (winWidth - leftEff - rightEff - SEARCH_MAX) / 2
  const minLeft = Math.max(navReserve, SHELL_PAD + leftEff)
  const maxLeft = winWidth - SHELL_PAD - rightEff - rightReserve - SEARCH_MAX
  const searchLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft))
  const navigate = useNavigate()
  const nav = useNavState()

  if (minimal) {
    return (
      <header className="app-drag relative flex h-14 shrink-0 items-center bg-bg">
        {isMac ? <div className="w-[78px] shrink-0" aria-hidden /> : null}
        <div className="ml-auto" />
        {isWindows ? <WindowsControls /> : null}
      </header>
    )
  }

  return (
    <header className="app-drag relative flex h-14 shrink-0 items-center bg-bg">
      {isMac ? <div className="w-[78px] shrink-0" aria-hidden /> : null}

      <nav className={`app-no-drag flex items-center gap-2 ${isWindows ? 'ml-4' : 'ml-6'}`}>
        <IconButton
          variant="ink"
          size="md"
          aria-label="Back"
          disabled={!nav.canGoBack}
          onClick={nav.back}
        >
          <ChevronLeftIcon className="size-4" />
        </IconButton>
        <IconButton
          variant="ink"
          size="md"
          aria-label="Forward"
          disabled={!nav.canGoForward}
          onClick={nav.forward}
        >
          <ChevronRightIcon className="size-4" />
        </IconButton>
        <IconButton variant="ink" size="md" aria-label="Home" onClick={() => navigate({ to: '/' })}>
          <HomeIcon className="size-[18px]" />
        </IconButton>
        {leftCollapsed ? (
          <IconButton variant="ink" size="md" aria-label="Show library" onClick={onExpandLeft}>
            <SidebarLeftIcon className="size-[18px]" />
          </IconButton>
        ) : null}
      </nav>

      <div
        className="app-no-drag absolute top-0 bottom-0 left-0 flex items-center pt-[5.2px]"
        style={{ width: SEARCH_MAX, transform: `translateX(${searchLeft}px)` }}
      >
        <SearchControl />
      </div>

      <div className="app-no-drag ml-auto flex shrink-0 items-center gap-2 pr-2.5">
        {rightCollapsed ? (
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Show friend activity"
            onClick={onExpandRight}
          >
            <UserGroupIcon className="size-5" />
          </IconButton>
        ) : null}
        <NotificationPopover />
        <UserMenu />
      </div>

      {isWindows ? <WindowsControls /> : null}
    </header>
  )
}

function WindowsControls(): React.JSX.Element {
  return (
    <div className="app-no-drag flex shrink-0 items-center">
      <button
        type="button"
        aria-label="Minimize"
        onClick={() => window.api.window.minimize()}
        className="flex h-10 w-[46px] items-center justify-center bg-transparent text-text-tertiary outline-none hover:bg-white/[0.08]"
      >
        <WinMinimizeIcon className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={() => window.api.window.toggleMaximize()}
        className="flex h-10 w-[46px] items-center justify-center bg-transparent text-text-tertiary outline-none hover:bg-white/[0.08]"
      >
        <WinMaximizeIcon className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={() => window.api.window.close()}
        className="flex h-10 w-[46px] items-center justify-center bg-transparent text-text-tertiary outline-none hover:bg-[#e81123] hover:text-white"
      >
        <WinCloseIcon className="size-4" />
      </button>
    </div>
  )
}
