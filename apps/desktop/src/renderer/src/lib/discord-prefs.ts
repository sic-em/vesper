const KEY_DISCORD_RPC = 'vesper.playback.discordRpc'

export function readDiscordRpcEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(KEY_DISCORD_RPC)
  if (raw === null) return true
  return raw === '1'
}

export function writeDiscordRpcEnabled(on: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY_DISCORD_RPC, on ? '1' : '0')
}
