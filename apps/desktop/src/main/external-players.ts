import { spawn } from 'child_process'
import { promises as fsp } from 'fs'

export type ExternalPlayerId = 'vlc' | 'iina' | 'mpv'

export interface ExternalPlayer {
  id: ExternalPlayerId
  name: string
}

interface PlayerDef {
  id: ExternalPlayerId
  name: string
  candidates: string[]
  args: (bin: string, url: string, startSec: number) => { bin: string; argv: string[] }
}

const MAC_PLAYERS: PlayerDef[] = [
  {
    id: 'vlc',
    name: 'VLC',
    candidates: ['/Applications/VLC.app/Contents/MacOS/VLC'],
    args: (bin, url, startSec) => ({ bin, argv: [`--start-time=${startSec}`, url] })
  },
  {
    id: 'iina',
    name: 'IINA',
    candidates: ['/Applications/IINA.app/Contents/MacOS/iina-cli'],
    args: (bin, url, startSec) => ({ bin, argv: [`--mpv-start=${startSec}`, url] })
  },
  {
    id: 'mpv',
    name: 'mpv',
    candidates: [
      '/opt/homebrew/bin/mpv',
      '/usr/local/bin/mpv',
      '/Applications/mpv.app/Contents/MacOS/mpv'
    ],
    args: (bin, url, startSec) => ({ bin, argv: [`--start=${startSec}`, url] })
  }
]

const WIN_PLAYERS: PlayerDef[] = [
  {
    id: 'vlc',
    name: 'VLC',
    candidates: [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'
    ],
    args: (bin, url, startSec) => ({ bin, argv: [`--start-time=${startSec}`, url] })
  },
  {
    id: 'mpv',
    name: 'mpv',
    candidates: [
      `${process.env.LOCALAPPDATA ?? ''}\\Programs\\mpv\\mpv.exe`,
      `${process.env.USERPROFILE ?? ''}\\scoop\\apps\\mpv\\current\\mpv.exe`,
      'C:\\Program Files\\mpv\\mpv.exe'
    ],
    args: (bin, url, startSec) => ({ bin, argv: [`--start=${startSec}`, url] })
  }
]

async function firstExisting(paths: string[]): Promise<string | null> {
  for (const p of paths) {
    if (!p || p.startsWith('\\')) continue
    try {
      await fsp.access(p)
      return p
    } catch {
      // keep looking
    }
  }
  return null
}

function defsForPlatform(): PlayerDef[] {
  if (process.platform === 'darwin') return MAC_PLAYERS
  if (process.platform === 'win32') return WIN_PLAYERS
  return []
}

const binCache = new Map<ExternalPlayerId, string>()

export async function listExternalPlayers(): Promise<ExternalPlayer[]> {
  const out: ExternalPlayer[] = []
  for (const def of defsForPlatform()) {
    const bin = await firstExisting(def.candidates)
    if (bin) {
      binCache.set(def.id, bin)
      out.push({ id: def.id, name: def.name })
    }
  }
  return out
}

export async function openInExternalPlayer(
  id: ExternalPlayerId,
  url: string,
  positionSec: number
): Promise<void> {
  if (!/^https:\/\//.test(url)) throw new Error('external player: refusing non-https url')
  const def = defsForPlatform().find((d) => d.id === id)
  if (!def) throw new Error(`external player not supported here: ${id}`)
  const bin = binCache.get(id) ?? (await firstExisting(def.candidates))
  if (!bin) throw new Error(`external player not installed: ${id}`)
  const startSec = Math.max(0, Math.floor(positionSec))
  const { bin: cmd, argv } = def.args(bin, url, startSec)
  const child = spawn(cmd, argv, { detached: true, stdio: 'ignore' })
  child.unref()
}
