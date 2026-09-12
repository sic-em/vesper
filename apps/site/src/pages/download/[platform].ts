import type { APIRoute } from "astro"

export const prerender = false

const R2_BASE = "https://pub-92303d062b7f481ea248cd257e2b658c.r2.dev/release"

const MANIFESTS: Record<string, string> = {
  windows: "latest.yml",
  mac: "latest-mac.yml",
}

// Reads the electron-updater feed so the download link always points at the
// artifact that actually exists in R2, even after old versions are pruned.
export const GET: APIRoute = async ({ params }) => {
  const manifest = MANIFESTS[params.platform ?? ""]
  if (!manifest) return new Response("Not found", { status: 404 })

  const res = await fetch(`${R2_BASE}/${manifest}`, {
    headers: { "cache-control": "no-cache" },
  })
  if (!res.ok) return new Response("Release feed unavailable", { status: 502 })

  const path = (await res.text()).match(/^path:\s*(.+)$/m)?.[1]?.trim()
  if (!path) return new Response("Malformed release feed", { status: 502 })

  return new Response(null, {
    status: 302,
    headers: {
      location: `${R2_BASE}/${path}`,
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  })
}
