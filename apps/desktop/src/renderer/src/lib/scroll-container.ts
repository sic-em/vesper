import { createContext, useContext } from 'react'

// The authenticated layout owns the one scrollable pane that routes render into.
// Pages that need the scroller itself (e.g. to drive a virtualizer) read it from here.
export const ScrollContainerContext = createContext<React.RefObject<HTMLDivElement | null> | null>(
  null
)

export function useScrollContainer(): React.RefObject<HTMLDivElement | null> | null {
  return useContext(ScrollContainerContext)
}
