/**
 * Sentry client-side error tracking.
 *
 * Solo se carga si SENTRY_DSN está configurada (opt-in).
 */
import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn
  if (!dsn) return

  const router = useRouter()
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.dev ? 'development' : 'production',
  })

  // Asociar usuario cuando se loguea
  const user = useSupabaseUser()
  watchEffect(() => {
    if (user.value) {
      Sentry.setUser({ id: user.value.id, email: user.value.email })
    } else {
      Sentry.setUser(null)
    }
  })
})
