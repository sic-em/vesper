import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@renderer/router'
import { NavShortcuts } from '@renderer/lib/nav-shortcuts'
import { DevtoolsShortcut } from '@renderer/lib/devtools-shortcut'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <NavShortcuts />
      <DevtoolsShortcut />
      <Outlet />
    </>
  )
})
