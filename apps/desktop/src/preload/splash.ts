import { contextBridge, ipcRenderer } from 'electron'

const CHANNELS = [
  'updater:checking',
  'updater:available',
  'updater:not-available',
  'updater:progress',
  'updater:downloaded',
  'updater:error'
] as const

type Channel = (typeof CHANNELS)[number]

const api = {
  on: (channel: Channel, cb: (payload?: unknown) => void): (() => void) => {
    if (!CHANNELS.includes(channel)) return () => {}
    const listener = (_e: unknown, payload?: unknown): void => cb(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('updater', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.updater = api
}
