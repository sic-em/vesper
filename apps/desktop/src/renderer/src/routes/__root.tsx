import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@renderer/router'
import { NavShortcuts } from '@renderer/lib/nav-shortcuts'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <NavShortcuts />
      <Outlet />
    </>
  )
})
