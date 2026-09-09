import { ipcMain } from 'electron'

// Kalshi's CDN rejects any browser Origin it doesn't allowlist (403 before
// CORS even applies), so the renderer can't call it. Main-process fetch sends
// no Origin header; market data rides back over IPC.
const KALSHI_BASE = 'https://api.elections.kalshi.com'

export function registerKalshi(): void {
  ipcMain.handle('fights:kalshiGet', async (_e, path: string): Promise<unknown> => {
    if (typeof path !== 'string' || !path.startsWith('/trade-api/v2/')) {
      throw new Error('invalid kalshi path')
    }
    const res = await fetch(KALSHI_BASE + path)
    if (!res.ok) throw new Error(`kalshi ${res.status}`)
    return await res.json()
  })
}
