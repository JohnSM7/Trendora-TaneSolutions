// https://nuxt.com/docs/api/configuration/nuxt-config
//
// MODELO A: la app vive bajo /app del dominio principal.
// En dev: Nuxt sirve desde http://localhost:3000/app/...
// En prod: Vercel rewrite envía /app/* desde trendora.tanesolutions.com a este proyecto.
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Cargar .env de la raíz del monorepo (un solo archivo para todas las apps)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
loadEnv({ path: resolve(__dirname, '../../.env') })

const APP_BASE = '/app'

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  css: ['@tane/ui/styles.css'],

  tailwindcss: {
    configPath: 'tailwind.config.ts',
    viewer: false,
  },

  supabase: {
    // Leemos de las env vars con los nombres que usamos en el monorepo
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirect: false,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      include: undefined,
      exclude: ['/auth/*', '/legal/*', '/api/webhooks/*'],
      cookieRedirect: false,
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  runtimeConfig: {
    // Server-only — leídas de env vars sin prefix NUXT_ (un solo .env para todo)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
    replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
    ayrshareApiKey: process.env.AYRSHARE_API_KEY || '',
    ayrsharePrivateKey: process.env.AYRSHARE_PRIVATE_KEY || '',
    ayrshareDomain: process.env.AYRSHARE_DOMAIN || '',
    ayrshareWebhookSecret: process.env.AYRSHARE_WEBHOOK_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || '',
    inngestEventKey: process.env.INNGEST_EVENT_KEY || '',
    inngestSigningKey: process.env.INNGEST_SIGNING_KEY || '',
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || '',

    // Cliente — leídas explícitamente de env vars sin prefix NUXT_PUBLIC_
    // para no duplicar nombres en el .env
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000/app',
      marketingUrl: process.env.MARKETING_URL || 'http://localhost:4321',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      posthogApiKey: process.env.POSTHOG_API_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://eu.posthog.com',
      sentryDsn: process.env.SENTRY_DSN || '',
    },
  },

  app: {
    baseURL: APP_BASE,
    // buildAssetsDir es relativo a baseURL → URL final será /app/_nuxt/...
    buildAssetsDir: '/_nuxt/',
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Trendora',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#5B5BD6' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  routeRules: {
    '/': { redirect: '/dashboard' },
    '/api/webhooks/**': { cors: false },
  },

  nitro: {
    storage: {
      cache: { driver: 'memory' },
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // habilitar en CI vía `nuxt typecheck`
  },
})
