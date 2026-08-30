export interface SubtitleCue {
  startSec: number
  endSec: number
  text: string
}

export async function fetchAndParseSubtitle(url: string): Promise<SubtitleCue[]> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Subtitle HTTP ${r.status}`)
  const buf = await r.arrayBuffer()
  const text = decodeSubtitleBytes(new Uint8Array(buf))
  return parseSubtitle(text)
}

export function decodeSubtitleBytes(bytes: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8', { fatal: true })
  try {
    return utf8.decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

export function parseSubtitle(text: string): SubtitleCue[] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim()
  if (clean.startsWith('WEBVTT')) return parseVtt(clean)
  if (/^\[(script info|v4\+? styles|events)\]/im.test(clean)) return parseAss(clean)
  return parseSrt(clean)
}

function parseSrt(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  for (const block of text.split(/\n\n+/)) {
    const lines = block.split('\n').filter(Boolean)
    if (lines.length < 2) continue
    const timingIdx = lines.findIndex((l) => l.includes('-->'))
    if (timingIdx === -1) continue
    const cue = parseTimingLine(lines[timingIdx])
    if (!cue) continue
    cue.text = lines.slice(timingIdx + 1).join('\n')
    cues.push(cue)
  }
  return cues
}

function parseVtt(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const blocks = text.split(/\n\n+/)
  for (const block of blocks) {
    if (block.startsWith('WEBVTT') || block.startsWith('NOTE') || block.startsWith('STYLE')) {
      continue
    }
    const lines = block.split('\n').filter(Boolean)
    const timingIdx = lines.findIndex((l) => l.includes('-->'))
    if (timingIdx === -1) continue
    const cue = parseTimingLine(lines[timingIdx])
    if (!cue) continue
    cue.text = lines.slice(timingIdx + 1).join('\n')
    cues.push(cue)
  }
  return cues
}

function parseAss(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  let inEvents = false
  let startIdx = 1
  let endIdx = 2
  let textIdx = 9
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('[')) {
      inEvents = /^\[events\]/i.test(trimmed)
      continue
    }
    if (!inEvents) continue
    const colon = trimmed.indexOf(':')
    if (colon === -1) continue
    const kind = trimmed.slice(0, colon).toLowerCase()
    const rest = trimmed.slice(colon + 1)
    if (kind === 'format') {
      const fmt = rest.split(',').map((s) => s.trim().toLowerCase())
      startIdx = fmt.indexOf('start')
      endIdx = fmt.indexOf('end')
      textIdx = fmt.indexOf('text')
      continue
    }
    if (kind !== 'dialogue') continue
    const fields = splitAssFields(rest, textIdx)
    const start = parseAssTime(fields[startIdx])
    const end = parseAssTime(fields[endIdx])
    if (start === null || end === null) continue
    const body = (fields[textIdx] ?? '').replace(/\\N/gi, '\n').replace(/\\h/g, ' ')
    cues.push({ startSec: start, endSec: end, text: body })
  }
  return cues.sort((a, b) => a.startSec - b.startSec)
}

// The Text field is always last and may itself contain commas, so only split off the leading fields.
function splitAssFields(line: string, textIdx: number): string[] {
  const out: string[] = []
  let rest = line
  for (let i = 0; i < textIdx; i++) {
    const c = rest.indexOf(',')
    if (c === -1) break
    out.push(rest.slice(0, c))
    rest = rest.slice(c + 1)
  }
  out.push(rest)
  return out
}

function parseAssTime(s: string | undefined): number | null {
  if (!s) return null
  const m = s.trim().match(/(\d+):(\d{2}):(\d{2})[.,](\d{1,3})/)
  if (!m) return null
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + Number(`0.${m[4]}`)
}

function parseTimingLine(line: string): SubtitleCue | null {
  const m = line.match(
    /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/
  )
  if (!m) return null
  const start = toSec(+m[1], +m[2], +m[3], +m[4])
  const end = toSec(+m[5], +m[6], +m[7], +m[8])
  return { startSec: start, endSec: end, text: '' }
}

function toSec(h: number, m: number, s: number, ms: number): number {
  return h * 3600 + m * 60 + s + ms / 1000
}

const TAG_RE = /<[^>]+>|\{\\[^}]+\}/g

export function stripSubtitleTags(text: string): string {
  return text.replace(TAG_RE, '')
}

export function findActiveCue(cues: SubtitleCue[], timeSec: number): SubtitleCue | null {
  let lo = 0
  let hi = cues.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const c = cues[mid]
    if (timeSec < c.startSec) hi = mid - 1
    else if (timeSec > c.endSec) lo = mid + 1
    else return c
  }
  return null
}
