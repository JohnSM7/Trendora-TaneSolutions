/**
 * PostHog client-side tracking.
 *
 * Solo se carga si POSTHOG_API_KEY está configurada (opt-in).
 * Identifica usuarios cuando se loguean.
 */
import posthog from 'posthog-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const apiKey = config.public.posthogApiKey
  if (!apiKey) return

  const ph = posthog.init(apiKey, {
    api_host: config.public.posthogHost ?? 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // lo hacemos manual con el router
    capture_pageleave: true,
    autocapture: true,
    loaded: (instance) => {
      if (import.meta.dev) instance.debug(false)
    },
  })

  const router = useRouter()
  router.afterEach((to) => {
    posthog.capture('$pageview', { $current_url: to.fullPath })
  })

  // Identify user al login
  const user = useSupabaseUser()
  watchEffect(() => {
    if (user.value) {
      posthog.identify(user.value.id, {
        email: user.value.email,
        created_at: user.value.created_at,
      })
    } else {
      posthog.reset()
    }
  })

  return { provide: { posthog: ph } }
})
