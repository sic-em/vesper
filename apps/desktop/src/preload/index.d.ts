import { ElectronAPI } from '@electron-toolkit/preload'

export type IconVariantId =
  | 'popcorn'
  | 'hidden-leaf'
  | 'akatsuki'
  | 'soda'
  | '3d'
  | 'super-saiyan'
  | 'ramen'

export interface DiscordActivity {
  details: string
  state: string
  largeImage: string
  largeText: string
  startTimestamp?: number
  endTimestamp?: number
}

export interface VesperApi {
  window: {
    minimize: () => Promise<void>
    restore: () => Promise<void>
    toggleMaximize: () => Promise<void>
    close: () => Promise<void>
    setFullScreen: (flag: boolean) => Promise<void>
    isFullScreen: () => Promise<boolean>
    onFullScreenChange: (cb: (fullscreen: boolean) => void) => () => void
  }
  discord: {
    setActivity: (input: DiscordActivity) => Promise<void>
    clearActivity: () => Promise<void>
  }
  storage: {
    imageCacheSize: () => Promise<number>
    clearImageCache: () => Promise<void>
    getCacheLimit: () => Promise<{ applied: number; pending: number }>
    setCacheLimit: (bytes: number) => Promise<void>
  }
  screenshot: {
    captureToClipboard: (rect: {
      x: number
      y: number
      width: number
      height: number
    }) => Promise<void>
  }
  devtools: {
    toggle: () => Promise<void>
  }
  subtitles: {
    pickFile: () => Promise<{ name: string; bytes: Uint8Array } | null>
  }
  externalPlayer: {
    list: () => Promise<Array<{ id: 'vlc' | 'iina' | 'mpv'; name: string }>>
    open: (id: 'vlc' | 'iina' | 'mpv', url: string, positionSec: number) => Promise<void>
  }
  app: {
    relaunch: () => Promise<void>
  }
  fights: {
    resolveStream: (embedUrl: string) => Promise<string>
    kalshiGet: (path: string) => Promise<unknown>
  }
  appIcon: {
    getVariant: () => Promise<IconVariantId>
    setVariant: (id: IconVariantId) => Promise<void>
  }
  onOpenUrl: (cb: (route: string) => void) => () => void
  onAuthCode: (cb: (code: string) => void) => () => void
  signalMainReady: () => void
  getAppVersion: () => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: VesperApi
  }
}
