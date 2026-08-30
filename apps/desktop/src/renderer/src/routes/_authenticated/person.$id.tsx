import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PersonHero } from '@renderer/components/media/person-hero'
import { PersonAbout } from '@renderer/components/media/person-about'
import {
  PersonKnownFor,
  type PersonKnownForItem
} from '@renderer/components/media/person-known-for'
import {
  PersonFilmography,
  type PersonFilmographyItem
} from '@renderer/components/media/person-filmography'
import { personCombinedCreditsQuery, personDetailsQuery } from '@renderer/lib/tmdb-queries'
import {
  formatBirthLine,
  personCreditTitle,
  personCreditYear,
  tmdbImage,
  type TmdbPersonCastCredit
} from '@renderer/lib/tmdb'

const BACKDROP_TILE_COUNT = 8
const KNOWN_FOR_COUNT = 30

export const Route = createFileRoute('/_authenticated/person/$id')({
  loader: async ({ context, params }) => {
    const qc = context.queryClient
    const id = Number(params.id)
    await Promise.all([
      qc.ensureQueryData(personDetailsQuery(id)),
      qc.ensureQueryData(personCombinedCreditsQuery(id))
    ])
  },
  component: PersonPage
})

function PersonPage(): React.JSX.Element {
  const { id } = Route.useParams()
  const personId = Number(id)
  const details = useSuspenseQuery(personDetailsQuery(personId))
  const credits = useSuspenseQuery(personCombinedCreditsQuery(personId))

  const cast = credits.data.cast
  const significant = dedupeCredits(cast).filter(isSignificantCredit)

  const backdrops = significant
    .toSorted((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .map((c) => tmdbImage(c.backdrop_path, 'w780'))
    .filter((u): u is string => !!u)
    .slice(0, BACKDROP_TILE_COUNT)

  const knownFor: PersonKnownForItem[] = significant
    .filter((c) => c.poster_path)
    .toSorted((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, KNOWN_FOR_COUNT)
    .map((c) => ({
      id: c.id,
      type: c.media_type,
      title: personCreditTitle(c),
      poster: tmdbImage(c.poster_path, 'w342') ?? '',
      character: c.character || '',
      year: personCreditYear(c)
    }))

  const filmography: PersonFilmographyItem[] = significant
    .filter((c) => c.poster_path)
    .map((c) => ({
      id: c.id,
      type: c.media_type,
      title: personCreditTitle(c),
      poster: tmdbImage(c.poster_path, 'w185') ?? '',
      character: c.character || '',
      year: personCreditYear(c),
      sortDate: dateToMillis(c.release_date ?? c.first_air_date ?? '')
    }))
    .sort((a, b) => b.sortDate - a.sortDate)

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PersonHero
        name={details.data.name}
        born={formatBirthLine(details.data)}
        profile={tmdbImage(details.data.profile_path, 'h632')}
        backdrops={backdrops}
      />
      <PersonAbout bio={details.data.biography ?? ''} />
      <PersonKnownFor items={knownFor} />
      <PersonFilmography items={filmography} />
    </div>
  )
}

function dedupeCredits(cast: TmdbPersonCastCredit[]): TmdbPersonCastCredit[] {
  const seen = new Map<string, TmdbPersonCastCredit>()
  for (const c of cast) {
    const key = `${c.media_type}:${c.id}`
    const existing = seen.get(key)
    if (!existing || c.popularity > existing.popularity) {
      seen.set(key, c)
    }
  }
  return [...seen.values()]
}

function dateToMillis(d: string): number {
  if (!d) return 0
  const t = Date.parse(d)
  return Number.isFinite(t) ? t : 0
}

const SELF_RE = /^(self|himself|herself|host|presenter|narrator)\b/i

function isSignificantCredit(c: TmdbPersonCastCredit): boolean {
  if (SELF_RE.test((c.character ?? '').trim())) return false
  return true
}
