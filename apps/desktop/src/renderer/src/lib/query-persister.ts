import { get, set, del, entries, createStore } from 'idb-keyval'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const idbStore = createStore('vesper-cache', 'tquery')

const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const v = await get<string>(key, idbStore)
    return v ?? null
  },
  setItem: (key: string, value: string): Promise<void> => set(key, value, idbStore),
  removeItem: (key: string): Promise<void> => del(key, idbStore)
}

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: 'vesper.tquery-cache',
  // Saves serialize on the main thread; a longer throttle coalesces scroll-driven
  // fetch bursts into fewer writes.
  throttleTime: 5000
})

export async function clearQueryCache(): Promise<void> {
  await del('vesper.tquery-cache', idbStore)
}

export async function getQueryCacheSize(): Promise<number> {
  try {
    const all = await entries(idbStore)
    let total = 0
    for (const [k, v] of all) {
      if (typeof k === 'string') total += k.length * 2
      if (typeof v === 'string') total += v.length * 2
    }
    return total
  } catch {
    return 0
  }
}
