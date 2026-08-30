import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000
const INITIAL_CHECK_DELAY_MS = 500
const INITIAL_GATE_TIMEOUT_MS = app.isPackaged ? 10_000 : 2_000
const HARD_GATE_TIMEOUT_MS = 15 * 60 * 1000
const MAINLINE_FEED_URL = 'https://pub-92303d062b7f481ea248cd257e2b658c.r2.dev/release'

type RegisterResult = { gateReady: Promise<void> }

export function registerUpdater(
  mainWindow: BrowserWindow,
  splashWindow: BrowserWindow | null
): RegisterResult {
  autoUpdater.logger = console
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  if (process.platform === 'win32') {
    Reflect.set(autoUpdater, 'verifyUpdateCodeSignature', () => Promise.resolve(null))
  }

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
    autoUpdater.updateConfigPath = path.join(__dirname, '..', '..', 'dev-app-update.yml')
  }

  autoUpdater.setFeedURL({ provider: 'generic', url: MAINLINE_FEED_URL })

  let gateResolved = false
  let availableSeen = false
  let resolveGate = (): void => {}

  const gateReady = new Promise<void>((resolve) => {
    resolveGate = (): void => {
      if (gateResolved) return
      gateResolved = true
      resolve()
    }
  })

  const initialGateTimer = setTimeout(() => {
    if (!availableSeen) {
      console.info('[updater] gate: no update available within initial window')
      resolveGate()
    }
  }, INITIAL_GATE_TIMEOUT_MS)

  const hardGateTimer = setTimeout(() => {
    console.warn('[updater] gate: hard timeout reached')
    resolveGate()
  }, HARD_GATE_TIMEOUT_MS)

  gateReady.then(() => {
    clearTimeout(initialGateTimer)
    clearTimeout(hardGateTimer)
  })

  const broadcast = (channel: string, payload?: unknown): void => {
    for (const win of [splashWindow, mainWindow]) {
      if (!win || win.isDestroyed()) continue
      try {
        win.webContents.send(channel, payload)
      } catch (err) {
        console.warn('[updater] broadcast failed', err)
      }
    }
  }

  autoUpdater.on('checking-for-update', () => broadcast('updater:checking'))

  autoUpdater.on('update-available', (info) => {
    availableSeen = true
    broadcast('updater:available', { version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    broadcast('updater:not-available')
    resolveGate()
  })

  autoUpdater.on('download-progress', (progress) =>
    broadcast('updater:progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  )

  autoUpdater.on('update-downloaded', (info) => {
    broadcast('updater:downloaded', { version: info.version })
    const installImmediately = app.isPackaged && !gateResolved
    if (installImmediately) {
      setTimeout(() => {
        try {
          autoUpdater.quitAndInstall(false, true)
        } catch (err) {
          console.error('[updater] quitAndInstall failed', err)
          resolveGate()
        }
      }, 600)
    } else {
      resolveGate()
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error', err)
    broadcast('updater:error', { message: err.message })
    resolveGate()
  })

  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { ok: true, version: result?.updateInfo.version ?? null }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
    }
  })

  ipcMain.handle('updater:install', () => {
    try {
      autoUpdater.quitAndInstall(false, true)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
    }
  })

  ipcMain.handle('updater:getVersion', () => app.getVersion())

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[updater] initial check failed', err)
      resolveGate()
    })
  }, INITIAL_CHECK_DELAY_MS)

  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[updater] periodic check failed', err)
    })
  }, CHECK_INTERVAL_MS)

  return { gateReady }
}
