import type { ComponentType } from 'react'
import Entry_1_3_0 from './1.3.0.mdx'
import Entry_1_5_0 from './1.5.0.mdx'
import Entry_1_6_0 from './1.6.0.mdx'
import Entry_1_7_0 from './1.7.0.mdx'
import Entry_1_8_0 from './1.8.0.mdx'
import Entry_1_8_2 from './1.8.2.mdx'
import Entry_1_9_0 from './1.9.0.mdx'
import Entry_2_0_0 from './2.0.0.mdx'
import Entry_2_1_0 from './2.1.0.mdx'
import Entry_2_3_0 from './2.3.0.mdx'
import Entry_2_5_0 from './2.5.0.mdx'

export interface ChangelogEntry {
  version: string
  date: string
  /** One line for the sidebar update card. */
  summary: string
  body: ComponentType<{ components?: Record<string, unknown> }>
}

export const entries: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: '2026-09-04',
    summary: 'Anime4K upscaling: low-res anime, sharpened on your GPU as you watch.',
    body: Entry_2_5_0
  },
  {
    version: '2.3.0',
    date: '2026-09-03',
    summary: 'Zoom with Ctrl +/-, and a hero backdrop that grows with the window.',
    body: Entry_2_3_0
  },
  {
    version: '2.1.0',
    date: '2026-09-03',
    summary: 'An Explore page, app icons you can pick, and the freeze on opening titles is gone.',
    body: Entry_2_1_0
  },
  {
    version: '2.0.0',
    date: '2026-09-02',
    summary: 'A leaner Vesper: notifications and list collaboration have been removed.',
    body: Entry_2_0_0
  },
  {
    version: '1.9.0',
    date: '2026-09-01',
    summary:
      'Two new stream sources, Sootio and Meteor, for a deeper and more reliable source list.',
    body: Entry_1_9_0
  },
  {
    version: '1.8.2',
    date: '2026-08-31',
    summary: 'Streams now use Vesper’s own Comet service for a more reliable source connection.',
    body: Entry_1_8_2
  },
  {
    version: '1.8.0',
    date: '2026-08-31',
    summary: 'Autoplay rolls you into the next episode, plus a pile of player fixes.',
    body: Entry_1_8_0
  },
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
