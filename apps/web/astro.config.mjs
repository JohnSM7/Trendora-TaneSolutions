import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { config as loadEnv } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Cargar .env de la raíz del monorepo
const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '../../.env') })

const SITE = process.env.MARKETING_URL ?? 'https://tanesolutions.com'

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [vue({ jsx: false }), tailwind({ applyBaseStyles: false }), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: {
      noExternal: ['@tane/ui'],
    },
  },
})
