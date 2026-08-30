import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BorderBeam } from 'border-beam'
import { TextShimmer } from './components/splash/text-shimmer'

type UpdaterPhase =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

type UpdaterApi = {
  on: (channel: string, cb: (payload?: unknown) => void) => () => void
}

declare global {
  interface Window {
    updater?: UpdaterApi
  }
}

function cleanVersion(raw?: string): string {
  if (!raw) return ''
  const dash = raw.indexOf('-')
  return dash === -1 ? raw : raw.slice(0, dash)
}

function statusLabel(phase: UpdaterPhase, version: string, percent: number): string {
  switch (phase) {
    case 'checking':
      return 'Checking for updates…'
    case 'available':
      return version ? `Update available v${version}…` : 'Update available…'
    case 'not-available':
      return 'Starting Vesper…'
    case 'downloading':
      return `Downloading update… ${Math.round(percent)}%`
    case 'downloaded':
      return 'Installing update…'
    case 'error':
      return 'Continuing…'
  }
}

function SplashApp(): React.JSX.Element {
  const [phase, setPhase] = useState<UpdaterPhase>('checking')
  const [version, setVersion] = useState('')
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    if (!window.updater) return
    const offs = [
      window.updater.on('updater:checking', () => setPhase('checking')),
      window.updater.on('updater:available', (p) => {
        const v = (p as { version?: string } | undefined)?.version
        setVersion(cleanVersion(v))
        setPercent(0)
        setPhase('available')
      }),
      window.updater.on('updater:not-available', () => setPhase('not-available')),
      window.updater.on('updater:progress', (p) => {
        const pct = (p as { percent?: number } | undefined)?.percent ?? 0
        setPercent(pct)
        setPhase('downloading')
      }),
      window.updater.on('updater:downloaded', () => {
        setPercent(100)
        setPhase('downloaded')
      }),
      window.updater.on('updater:error', () => setPhase('error'))
    ]
    return () => offs.forEach((off) => off())
  }, [])

  const showBar = phase === 'downloading' || phase === 'downloaded' || phase === 'available'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        boxSizing: 'border-box'
      }}
    >
      <BorderBeam
        colorVariant="sunset"
        theme="dark"
        size="md"
        style={{ width: '100%', height: '100%' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#201d1d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
            boxSizing: 'border-box',
            color: '#fdfcfc',
            fontFamily:
              '"Berkeley Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontVariantLigatures: 'none',
            minHeight: 164
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#9a9898',
              letterSpacing: '0.02em',
              minHeight: 18,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <TextShimmer duration={2.4} style={{ display: 'block' }}>
              {statusLabel(phase, version, percent)}
            </TextShimmer>
          </div>
          <div
            style={{
              marginTop: 18,
              width: '70%',
              maxWidth: 260,
              height: 2,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              overflow: 'hidden',
              opacity: showBar ? 1 : 0,
              transition: 'opacity 250ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, percent))}%`,
                background: '#fdfcfc',
                borderRadius: 999,
                transition: 'width 200ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            />
          </div>
        </div>
      </BorderBeam>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplashApp />
  </StrictMode>
)
