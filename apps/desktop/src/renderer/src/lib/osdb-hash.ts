// OpenSubtitles file hash (OSDb / "moviehash"): filesize plus the 64-bit little-endian word sum of
// the first and last 64 KiB, mod 2^64, as 16 lowercase hex chars. Passing it to the OpenSubtitles
// addon returns subtitles matched to this exact release, so they line up without manual sync.

const CHUNK = 65536
const MASK = (1n << 64n) - 1n

export interface OsdbHash {
  hash: string
  size: number
}

export async function computeOsdbHash(url: string): Promise<OsdbHash | null> {
  // Never let a slow CDN connection stall subtitle loading — bail to imdb-only after 1.5s.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 1500)
  try {
    const head = await fetch(url, {
      headers: { Range: `bytes=0-${CHUNK - 1}` },
      signal: ctrl.signal
    })
    // 200 means the server ignored the range and would stream the whole (huge) file — bail.
    if (head.status !== 206) return null
    const size = parseTotalSize(head.headers.get('Content-Range'))
    if (!size || size < CHUNK * 2) return null
    const headBytes = new Uint8Array(await head.arrayBuffer())

    const tail = await fetch(url, {
      headers: { Range: `bytes=${size - CHUNK}-${size - 1}` },
      signal: ctrl.signal
    })
    if (tail.status !== 206) return null
    const tailBytes = new Uint8Array(await tail.arrayBuffer())

    if (headBytes.length < CHUNK || tailBytes.length < CHUNK) return null

    let hash = BigInt(size) & MASK
    hash = (hash + sumWords(headBytes)) & MASK
    hash = (hash + sumWords(tailBytes)) & MASK
    return { hash: hash.toString(16).padStart(16, '0'), size }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function sumWords(bytes: Uint8Array): bigint {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let sum = 0n
  for (let i = 0; i + 8 <= bytes.length; i += 8) {
    sum = (sum + view.getBigUint64(i, true)) & MASK
  }
  return sum
}

function parseTotalSize(contentRange: string | null): number | null {
  if (!contentRange) return null
  const m = contentRange.match(/\/(\d+)\s*$/)
  return m ? Number(m[1]) : null
}
