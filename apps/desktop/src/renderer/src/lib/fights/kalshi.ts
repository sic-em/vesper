import { queryOptions } from '@tanstack/react-query'

// Kalshi prediction markets for UFC bouts: series KXUFCFIGHT holds one event
// per bout with a binary yes/no market per fighter. All requests go through
// the main process (window.api.fights.kalshiGet) because Kalshi's CDN rejects
// browser origins outright. Prices are dollar strings ("0.2000" = 20%).
// Tickers are NOT derivable from names (billing quirks) — always match titles.

const SERIES = 'KXUFCFIGHT'

export interface KalshiEvent {
  event_ticker: string
  title: string
}

export interface KalshiMarket {
  ticker: string
  title?: string
  yes_sub_title?: string
  last_price_dollars?: string
  status?: string
  result?: string
}

interface KalshiCandleSide {
  close_dollars?: string
}

export interface KalshiCandle {
  end_period_ts: number
  price?: {
    close_dollars?: string
    mean_dollars?: string
    previous_dollars?: string
  }
  yes_bid?: KalshiCandleSide
  yes_ask?: KalshiCandleSide
}

async function kalshiGet<T>(path: string): Promise<T> {
  return (await window.api.fights.kalshiGet(path)) as T
}

export const kalshiUfcEventsQuery = () =>
  queryOptions({
    queryKey: ['kalshi', 'ufc-events'],
    queryFn: async () => {
      const res = await kalshiGet<{ events?: KalshiEvent[] }>(
        `/trade-api/v2/events?series_ticker=${SERIES}&status=open&limit=200`
      )
      return res.events ?? []
    },
    staleTime: 5 * 60_000
  })

export const kalshiEventMarketsQuery = (eventTicker: string) =>
  queryOptions({
    queryKey: ['kalshi', 'event-markets', eventTicker],
    queryFn: async () => {
      const res = await kalshiGet<{ markets?: KalshiMarket[] }>(
        `/trade-api/v2/markets?event_ticker=${encodeURIComponent(eventTicker)}`
      )
      return res.markets ?? []
    },
    staleTime: 5_000,
    refetchInterval: 10_000
  })

// Full market lifetime: fight markets open about a week out, so 15 days of
// hourly candles covers the whole line like Kalshi's own chart.
const CANDLE_WINDOW_SEC = 15 * 24 * 3600

export const kalshiCandlesQuery = (marketTicker: string) =>
  queryOptions({
    queryKey: ['kalshi', 'candles', marketTicker],
    queryFn: async () => {
      const end = Math.floor(Date.now() / 1000)
      const start = end - CANDLE_WINDOW_SEC
      const res = await kalshiGet<{ candlesticks?: KalshiCandle[] }>(
        `/trade-api/v2/series/${SERIES}/markets/${encodeURIComponent(
          marketTicker
        )}/candlesticks?start_ts=${start}&end_ts=${end}&period_interval=60`
      )
      return res.candlesticks ?? []
    },
    staleTime: 30_000,
    refetchInterval: 60_000
  })

const NAME_SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv'])

/** Last name token, suffixes like "Jr." dropped. Original casing kept. */
export function surname(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter((t) => !NAME_SUFFIXES.has(t.toLowerCase()))
  return tokens[tokens.length - 1] ?? ''
}

/** Event titles read "Fight Night: Hooker vs Parnasse" — match both surnames. */
export function matchKalshiEvent(
  surnameA: string,
  surnameB: string,
  events: KalshiEvent[]
): KalshiEvent | null {
  const sa = surnameA.toLowerCase()
  const sb = surnameB.toLowerCase()
  if (!sa || !sb) return null
  return (
    events.find((e) => {
      const t = e.title.toLowerCase()
      return t.includes(sa) && t.includes(sb)
    }) ?? null
  )
}

export function marketForSurname(
  markets: KalshiMarket[],
  fighterSurname: string
): KalshiMarket | undefined {
  const s = fighterSurname.toLowerCase()
  if (!s) return undefined
  return markets.find((m) => (m.yes_sub_title ?? m.title ?? '').toLowerCase().includes(s))
}

/** A candle's win probability in percent; bid/ask midpoint when no trades. */
export function candleValue(c: KalshiCandle): number | null {
  const close = c.price?.close_dollars ?? c.price?.mean_dollars
  if (close !== undefined) return parseFloat(close) * 100
  const bid = c.yes_bid?.close_dollars
  const ask = c.yes_ask?.close_dollars
  if (bid !== undefined && ask !== undefined) {
    return ((parseFloat(bid) + parseFloat(ask)) / 2) * 100
  }
  const prev = c.price?.previous_dollars
  return prev !== undefined ? parseFloat(prev) * 100 : null
}

export function pricePct(m?: KalshiMarket): number | null {
  const p = m?.last_price_dollars
  return p !== undefined && p !== '' ? parseFloat(p) * 100 : null
}
