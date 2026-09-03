import { useState } from 'react'
import { Select } from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import {
  readLastLang as readSubLastLang,
  writeLastLang as writeSubLastLang,
  readAutoShow,
  writeAutoShow
} from '@renderer/lib/subtitle-prefs'
import { readAudioPreferredLang, writeAudioLastLang } from '@renderer/lib/audio-prefs'
import {
  readSkipButtonsEnabled,
  writeSkipButtonsEnabled,
  readPipMinimizeEnabled,
  writePipMinimizeEnabled
} from '@renderer/lib/player-prefs'
import { isHevcSupported, isWindows } from '@renderer/lib/platform'

interface LangOption {
  value: string
  label: string
}

const LANGS: LangOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'da', label: 'Danish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'cs', label: 'Czech' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'th', label: 'Thai' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'id', label: 'Indonesian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'fa', label: 'Persian' }
]

export function PlaybackSection(): React.JSX.Element {
  const [audioLang, setAudioLang] = useState(() => readAudioPreferredLang())
  const [subLang, setSubLang] = useState(() => readSubLastLang() ?? 'en')
  const [autoShow, setAutoShow] = useState(() => readAutoShow())
  const [skipButtons, setSkipButtons] = useState(() => readSkipButtonsEnabled())
  const [pipMinimize, setPipMinimize] = useState(() => readPipMinimizeEnabled())

  const showHevcNotice = isWindows && !isHevcSupported()

  return (
    <div className="flex flex-col gap-2">
      {showHevcNotice ? (
        <a
          href="ms-windows-store://pdp/?productid=9N4WGH0Z6VHQ"
          target="_blank"
          rel="noreferrer"
          className="mb-2 flex flex-col gap-1 rounded-lg bg-[#3a2418] px-4 py-3 outline-none"
        >
          <span className="text-[13px] leading-5 font-semibold text-[#f5a85a]">
            Install HEVC Video Extensions for h.265 playback
          </span>
          <span className="text-[12px] leading-4 font-medium text-[#f5a85a]/80">
            Without it, h.265 streams fall back to slow software transmux. Tap to open the Microsoft
            Store.
          </span>
        </a>
      ) : null}
      <SelectRow
        title="Preferred audio language"
        description="Auto-switch on streams that include this language."
        value={audioLang}
        onChange={(v) => {
          setAudioLang(v)
          writeAudioLastLang(v)
        }}
        options={LANGS}
      />
      <SelectRow
        title="Preferred subtitle language"
        description="Used when subtitles are available in the stream."
        value={subLang}
        onChange={(v) => {
          setSubLang(v)
          writeSubLastLang(v)
        }}
        options={LANGS}
      />
      <ToggleRow
        title="Always show subtitles"
        description="Auto-enable subtitles in your preferred language when available."
        value={autoShow}
        onChange={(v) => {
          setAutoShow(v)
          writeAutoShow(v)
        }}
      />
      <ToggleRow
        title="Show skip intro/recap button"
        description="A button appears during the intro or recap, letting you jump past it."
        value={skipButtons}
        onChange={(v) => {
          setSkipButtons(v)
          writeSkipButtonsEnabled(v)
        }}
      />
      <ToggleRow
        title="Minimize during picture-in-picture"
        description="Tuck the main window away while playback is in the floating window, and bring it back after."
        value={pipMinimize}
        onChange={(v) => {
          setPipMinimize(v)
          writePipMinimizeEnabled(v)
        }}
      />
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-1 py-3 last:border-b-0">
      {children}
    </div>
  )
}

function RowText({
  title,
  description
}: {
  title: string
  description: string
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-[13px] leading-4 font-medium text-text">{title}</span>
      <span className="truncate text-[12px] leading-4 font-medium text-text-muted">
        {description}
      </span>
    </div>
  )
}

function SelectRow({
  title,
  description,
  value,
  onChange,
  options
}: {
  title: string
  description: string
  value: string
  onChange: (v: string) => void
  options: LangOption[]
}): React.JSX.Element {
  return (
    <Row>
      <RowText title={title} description={description} />
      <Select value={value} onChange={onChange} options={options} ariaLabel={title} />
    </Row>
  )
}

function ToggleRow({
  title,
  description,
  value,
  onChange
}: {
  title: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <Row>
      <RowText title={title} description={description} />
      <Switch checked={value} onCheckedChange={onChange} />
    </Row>
  )
}
