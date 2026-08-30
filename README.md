## What you need

- Node 22+ and pnpm 9
- A free [Convex](https://convex.dev) account (the backend runs on your own deployment)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (metadata)
- A **Real-Debrid premium** account (streams come from its cache)
- Optional: [Fanart.tv](https://fanart.tv/get-an-api-key/) and [OMDb](https://www.omdbapi.com/apikey.aspx) keys for richer artwork and ratings, a Discord app for login, a Trakt app for watch-history sync

## Setup

```bash
git clone https://github.com/sic-em/vesper
cd vesper
pnpm install
```

**1. Frontend keys** — copy the template and fill it in:

```bash
cp .env.example .env
```

**2. Backend** — start Convex once so it creates your deployment:

```bash
npx convex dev
```

**3. Auth** — generate the signing keys and create a [Discord OAuth app](https://discord.com/developers/applications) (redirect URL: your Convex site URL + `/api/auth/callback/discord`):

```bash
npx @convex-dev/auth
npx convex env set AUTH_DISCORD_ID <your app id>
npx convex env set AUTH_DISCORD_SECRET <your app secret>
npx convex env set SITE_URL http://localhost:5173
```

**4. Streams** — point the backend at your Real-Debrid account:

```bash
npx convex env set RD_API_KEY <token from real-debrid.com/apitoken>
npx convex env set TORRENTIO_BASE "https://torrentio.strem.fun/realdebrid=<that same token>"
npx convex env set COMET_BASE "<a Comet instance URL with your config>"
```

For `COMET_BASE`, open any [Comet](https://github.com/g0ldyy/comet) instance's configure page, enter your Real-Debrid key, and copy the manifest URL minus the trailing `/manifest.json`. Either source works alone; with both configured, results are merged.

**5. Optional extras** (skip freely):

| Variable                                                                                      | What it enables                                                   |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `FANART_API_KEY`                                                                              | Logos and extra artwork                                           |
| `TRAKT_CLIENT_ID` / `TRAKT_CLIENT_SECRET`                                                     | Trakt sync ([create an app](https://trakt.tv/oauth/applications)) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | Avatar and banner uploads (any S3-compatible bucket)              |
| `DISCORD_FEEDBACK_WEBHOOK` / `DISCORD_PRESENCE_WEBHOOK`                                       | In-app feedback and presence pings to your Discord                |

## Run it

```bash
pnpm dev
```

Starts Electron and the Convex dev backend together.

## Package it

```bash
pnpm --filter @vesper/desktop dist:mac:nopub   # macOS (arm64)
pnpm --filter @vesper/desktop dist:win:nopub   # Windows (x64)
```

Installers land in `apps/desktop/dist-builder/`. Signing and notarization only run if you export the usual electron-builder variables (`CSC_LINK`, `APPLE_ID`, …); without them you get an unsigned build that runs fine locally.

Releases for this repo are built by GitHub Actions on version tags (`.github/workflows/release.yml`).
