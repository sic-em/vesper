const ENDPOINT = 'https://caching.graphql.imdb.com/'

const QUERY = `query R($id: ID!) {
  title(id: $id) {
    id
    ratingsSummary { aggregateRating voteCount }
    metacritic { metascore { score } }
  }
}`

export interface ImdbRatings {
  imdb?: number
  imdbVotes?: number
  metacritic?: number
}

interface GqlResponse {
  data?: {
    title?: {
      ratingsSummary?: { aggregateRating?: number; voteCount?: number }
      metacritic?: { metascore?: { score?: number } }
    }
  }
  errors?: unknown[]
}

export async function fetchImdbRatings(imdbId: string): Promise<ImdbRatings | null> {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-imdb-user-country': 'US',
      'x-imdb-user-language': 'en-US'
    },
    body: JSON.stringify({ query: QUERY, variables: { id: imdbId } })
  })
  if (r.status === 401 || r.status === 403 || r.status === 404) return null
  if (!r.ok) throw new Error(`IMDb ${r.status}`)
  const body = (await r.json()) as GqlResponse
  if (body.errors?.length || !body.data?.title) return null
  const t = body.data.title
  return {
    imdb: t.ratingsSummary?.aggregateRating,
    imdbVotes: t.ratingsSummary?.voteCount,
    metacritic: t.metacritic?.metascore?.score
  }
}

export function pickImdb(r: ImdbRatings | null | undefined): string | undefined {
  if (!r?.imdb) return undefined
  return r.imdb.toFixed(1)
}

export function pickMetacritic(r: ImdbRatings | null | undefined): number | undefined {
  return r?.metacritic
}
