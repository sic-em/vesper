import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ScrollSection } from '@renderer/components/ui/scroll-section'
import { FightEventCard } from './fight-event-card'
import {
  fightMatchesQuery,
  fightPosterUrl,
  isFightToday,
  isUfcTitle,
  liveMatchesQuery,
  type FightMatch
} from '@renderer/lib/fights/api'
import { matchEspnEvent, ufcScoreboardQuery, type EspnEvent } from '@renderer/lib/fights/espn'

// The Fights row: live fights first, then today's upcoming ones. It renders
// nothing at all on quiet days or when the source is down — the homepage never
// shows an empty shelf for it.
export function FightsSection(): React.JSX.Element | null {
  const navigate = useNavigate()
  const matches = useQuery(fightMatchesQuery())
  const liveMatches = useQuery(liveMatchesQuery())

  const rows = useMemo(() => {
    const all = matches.data ?? []
    const live = new Set(
      (liveMatches.data ?? []).filter((m) => m.category === 'fight').map((m) => m.id)
    )
    const liveRows = all.filter((m) => live.has(m.id))
    const upcoming = all
      .filter((m) => !live.has(m.id) && isFightToday(m) && m.date > Date.now())
      .sort((a, b) => a.date - b.date)
    return [...liveRows, ...upcoming].map((m) => ({ match: m, live: live.has(m.id) }))
  }, [matches.data, liveMatches.data])

  const anyUfc = rows.some((r) => isUfcTitle(r.match.title))
  const scoreboard = useQuery({ ...ufcScoreboardQuery(Date.now()), enabled: anyUfc })

  if (rows.length === 0) return null

  return (
    <ScrollSection title="Fights">
      {rows.map(({ match, live }) => (
        <FightRowCard
          key={match.id}
          match={match}
          live={live}
          espnEvents={scoreboard.data ?? []}
          onWatch={() =>
            void navigate({
              to: '/watch-fight/$id',
              params: { id: match.id },
              search: { title: match.title, poster: fightPosterUrl(match) },
              viewTransition: false
            })
          }
          onDetails={(espnId) =>
            void navigate({
              to: '/fights/$id',
              params: { id: match.id },
              search: { espnId },
              viewTransition: false
            })
          }
        />
      ))}
    </ScrollSection>
  )
}

function FightRowCard({
  match,
  live,
  espnEvents,
  onWatch,
  onDetails
}: {
  match: FightMatch
  live: boolean
  espnEvents: EspnEvent[]
  onWatch: () => void
  onDetails: (espnId: string) => void
}): React.JSX.Element {
  const espnEvent = isUfcTitle(match.title) ? matchEspnEvent(match, espnEvents) : null

  // UFC events with a matched card are clickable anytime; everything else is
  // watchable when live and inert until then.
  const onClick = espnEvent ? () => onDetails(espnEvent.id) : live ? onWatch : undefined

  const timeLabel = live
    ? undefined
    : new Date(match.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <FightEventCard
      title={match.title}
      poster={fightPosterUrl(match)}
      live={live}
      timeLabel={timeLabel}
      onClick={onClick}
    />
  )
}
