import { ipcMain, powerSaveBlocker, type WebContents } from 'electron'

// One blocker per window. A window that navigates away, pauses, or closes releases its own
// blocker, so a stale one can never keep the machine awake after playback has stopped.
const blockers = new Map<number, number>()

function release(sender: WebContents): void {
  const id = blockers.get(sender.id)
  if (id === undefined) return
  blockers.delete(sender.id)
  if (powerSaveBlocker.isStarted(id)) powerSaveBlocker.stop(id)
}

function acquire(sender: WebContents): void {
  const existing = blockers.get(sender.id)
  if (existing !== undefined && powerSaveBlocker.isStarted(existing)) return
  blockers.set(sender.id, powerSaveBlocker.start('prevent-display-sleep'))
  sender.once('destroyed', () => release(sender))
}

export function registerPower(): void {
  ipcMain.handle('power:setPlaybackActive', (event, active: boolean) => {
    if (active) acquire(event.sender)
    else release(event.sender)
  })
}
