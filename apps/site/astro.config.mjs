// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import vercel from "@astrojs/vercel"

export default defineConfig({
  site: "https://vespr.dev",
  output: "server",
  adapter: vercel(),
  vite: {
    envDir: "../..",
    plugins: [tailwindcss()],
  },
  integrations: [react(), sitemap()],
})
