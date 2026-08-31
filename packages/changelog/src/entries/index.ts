import type { ComponentType } from 'react'
import Entry_1_3_0 from './1.3.0.mdx'
import Entry_1_5_0 from './1.5.0.mdx'
import Entry_1_6_0 from './1.6.0.mdx'
import Entry_1_7_0 from './1.7.0.mdx'

export interface ChangelogEntry {
  version: string
  date: string
  /** One line for the sidebar update card. */
  summary: string
  body: ComponentType<{ components?: Record<string, unknown> }>
}

export const entries: ChangelogEntry[] = [
  {
    version: '1.7.0',
    date: '2026-08-31',
    summary: 'A new look and typeface, source sorting, Discord in VLC, and a stack of fixes.',
    body: Entry_1_7_0
  },
  {
    version: '1.6.0',
    date: '2026-08-31',
    summary: 'A fresh look, source sorting, Discord presence in VLC, and a stack of player fixes.',
    body: Entry_1_6_0
  },
  {
    version: '1.5.0',
    date: '2026-08-30',
    summary: 'Sort the source list by quality or size, plus fullscreen and PiP fixes.',
    body: Entry_1_5_0
  },
  {
    version: '1.3.0',
    date: '2026-08-30',
    summary: 'Send your stream to VLC, IINA, or mpv, plus a softer look across the app.',
    body: Entry_1_3_0
  }
]

export function entryByVersion(version: string): ChangelogEntry | undefined {
  return entries.find((e) => e.version === version)
}

export function latestEntry(): ChangelogEntry | undefined {
  return entries[0]
}
