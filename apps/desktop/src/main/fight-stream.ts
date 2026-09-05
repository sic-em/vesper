import { BrowserWindow, ipcMain, session } from 'electron'
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from 'http'
import { request as httpsRequest } from 'https'
import { randomBytes } from 'crypto'
import { URL } from 'url'

// Live fight streams sit behind an embed page that decrypts its playlist URL
// inside obfuscated WASM (ADR-0017). A hidden window loads the embed, we catch
// the playlist request it makes, and playback then flows through a local proxy
// that attaches the headers the stream hosts demand — the renderer's hls.js
// only ever talks to 127.0.0.1.

const EMBED_REFERER = 'https://embed.st/'
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const EMBED_TIMEOUT_MS = 25_000
const EMBED_PARTITION = 'fights-embed'
const M3U8_RE = /\.m3u8(\?|$)/i
const MAX_REDIRECTS = 3

let proxyServer: Server | null = null
let proxyPort = 0
let proxyToken = ''

function upstreamHeaders(): Record<string, string> {
  return {
    Referer: EMBED_REFERER,
    'Icy-MetaData': '1',
    'User-Agent': CHROME_UA
  }
}

function fetchUpstream(rawUrl: string, redirectsLeft = MAX_REDIRECTS): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    let target: URL
    try {
      target = new URL(rawUrl)
    } catch {
      reject(new Error('bad upstream url'))
      return
    }
    if (target.protocol !== 'https:' && target.protocol !== 'http:') {
      reject(new Error('unsupported upstream protocol'))
      return
    }
    const doRequest = target.protocol === 'https:' ? httpsRequest : httpRequest
    const req = doRequest(target, { headers: upstreamHeaders() }, (res) => {
      const status = res.statusCode ?? 0
      const location = res.headers.location
      if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
        res.resume()
        fetchUpstream(new URL(location, target).toString(), redirectsLeft - 1).then(resolve, reject)
        return
      }
      resolve(res)
    })
    req.on('error', reject)
    req.setTimeout(20_000, () => req.destroy(new Error('upstream timed out')))
    req.end()
  })
}

function proxyUrlFor(absUrl: string): string {
  const kind = M3U8_RE.test(absUrl) ? 'playlist' : 'seg'
  return `http://127.0.0.1:${proxyPort}/${kind}?t=${proxyToken}&u=${encodeURIComponent(absUrl)}`
}

// URI lines and URI="..." attributes both get rerouted through the proxy so
// every follow-up request (variant playlists, init maps, segments on whatever
// host the playlist names) carries the required headers.
function rewritePlaylist(text: string, baseUrl: string): string {
  const rewriteRef = (ref: string): string => {
    try {
      return proxyUrlFor(new URL(ref, baseUrl).toString())
    } catch {
      return ref
    }
  }
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return line
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => `URI="${rewriteRef(uri)}"`)
      }
      return rewriteRef(trimmed)
    })
    .join('\n')
}

function readBody(res: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    res.on('data', (c: Buffer) => chunks.push(c))
    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    res.on('error', reject)
  })
}

function baseResponseHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'cache-control': 'no-store'
  }
}

async function handleProxyRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  if (url.searchParams.get('t') !== proxyToken) {
    res.writeHead(403).end()
    return
  }
  const target = url.searchParams.get('u') ?? ''
  if (url.pathname === '/playlist') {
    const upstream = await fetchUpstream(target)
    if ((upstream.statusCode ?? 0) >= 400) {
      upstream.resume()
      res.writeHead(502, baseResponseHeaders()).end()
      return
    }
    const body = await readBody(upstream)
    res
      .writeHead(200, {
        ...baseResponseHeaders(),
        'content-type': 'application/vnd.apple.mpegurl'
      })
      .end(rewritePlaylist(body, target))
    return
  }
  if (url.pathname === '/seg') {
    const upstream = await fetchUpstream(target)
    res.writeHead(upstream.statusCode ?? 502, {
      ...baseResponseHeaders(),
      'content-type': upstream.headers['content-type'] ?? 'application/octet-stream'
    })
    upstream.pipe(res)
    upstream.on('error', () => res.destroy())
    return
  }
  res.writeHead(404).end()
}

function ensureProxy(): Promise<void> {
  if (proxyServer) return Promise.resolve()
  proxyToken = randomBytes(16).toString('hex')
  const server = createServer((req, res) => {
    handleProxyRequest(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(502, baseResponseHeaders())
      res.end()
    })
  })
  proxyServer = server
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') proxyPort = addr.port
      resolve()
    })
  })
}

// One hidden embed at a time: the intercept listener is session-wide, so
// concurrent loads would race for it.
let embedQueue: Promise<unknown> = Promise.resolve()

function interceptPlaylist(embedUrl: string): Promise<string> {
  const ses = session.fromPartition(EMBED_PARTITION)
  ses.setUserAgent(CHROME_UA)
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    webPreferences: {
      partition: EMBED_PARTITION,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })
  win.webContents.setAudioMuted(true)
  // The embed page is dense with popup/ad scripts — nothing it opens may
  // surface, and the window itself never shows.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (err: Error | null, playlistUrl?: string): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      ses.webRequest.onBeforeRequest(null)
      if (!win.isDestroyed()) win.destroy()
      if (err) reject(err)
      else resolve(playlistUrl ?? '')
    }
    const timer = setTimeout(
      () => finish(new Error('timed out waiting for the stream')),
      EMBED_TIMEOUT_MS
    )
    ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      if (M3U8_RE.test(details.url)) {
        callback({ cancel: true })
        finish(null, details.url)
        return
      }
      callback({})
    })
    win.webContents.on('did-fail-load', (_e, _code, desc, _url, isMainFrame) => {
      if (isMainFrame) finish(new Error(`embed failed to load (${desc})`))
    })
    win.loadURL(embedUrl).catch((err: Error) => finish(err))
  })
}

// Kalshi's CDN rejects any browser Origin it doesn't allowlist (403 before
// CORS even applies), so the renderer can't call it. Main-process fetch sends
// no Origin header; market data rides back over IPC.
const KALSHI_BASE = 'https://api.elections.kalshi.com'

export function registerFightStreams(): void {
  ipcMain.handle('fights:kalshiGet', async (_e, path: string): Promise<unknown> => {
    if (typeof path !== 'string' || !path.startsWith('/trade-api/v2/')) {
      throw new Error('invalid kalshi path')
    }
    const res = await fetch(KALSHI_BASE + path)
    if (!res.ok) throw new Error(`kalshi ${res.status}`)
    return await res.json()
  })

  ipcMain.handle('fights:resolveStream', async (_e, embedUrl: string): Promise<string> => {
    if (typeof embedUrl !== 'string' || !embedUrl.startsWith('https://')) {
      throw new Error('invalid embed url')
    }
    const run = embedQueue.then(() => interceptPlaylist(embedUrl))
    embedQueue = run.catch(() => undefined)
    const playlistUrl = await run
    await ensureProxy()
    return proxyUrlFor(playlistUrl)
  })
}

export function stopFightProxy(): void {
  proxyServer?.close()
  proxyServer = null
}
