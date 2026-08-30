import type { ComponentType } from 'react'
import Entry_1_2_1 from './1.2.1.mdx'

export interface ChangelogEntry {
  version: string
  date: string
  body: ComponentType<{ components?: Record<string, unknown> }>
}

export const entries: ChangelogEntry[] = [
  { version: '1.2.1', date: '2026-07-30', body: Entry_1_2_1 }
]

export function entryByVersion(version: string): ChangelogEntry | undefined {
  return entries.find((e) => e.version === version)
}

export function latestEntry(): ChangelogEntry | undefined {
  return entries[0]
}
