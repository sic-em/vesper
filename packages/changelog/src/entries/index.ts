import type { ComponentType } from 'react'
import Entry_1_3_0 from './1.3.0.mdx'
import Entry_1_5_0 from './1.5.0.mdx'

export interface ChangelogEntry {
  version: string
  date: string
  body: ComponentType<{ components?: Record<string, unknown> }>
}

export const entries: ChangelogEntry[] = [
  { version: '1.5.0', date: '2026-08-30', body: Entry_1_5_0 },
  { version: '1.3.0', date: '2026-08-30', body: Entry_1_3_0 }
]

export function entryByVersion(version: string): ChangelogEntry | undefined {
  return entries.find((e) => e.version === version)
}

export function latestEntry(): ChangelogEntry | undefined {
  return entries[0]
}
