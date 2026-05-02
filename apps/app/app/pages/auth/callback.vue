<script setup lang="ts">
/**
 * Página de callback del magic link.
 *
 * Supabase puede entregar la sesión de tres formas distintas según versión y flujo:
 *   1. Query `?code=xxx` (PKCE flow) → llamar exchangeCodeForSession
 *   2. Hash `#access_token=xxx&refresh_token=yyy` (implicit flow) → setSession
 *   3. La sesión se establece automáticamente y solo hay que esperar
 *
 * Esta página los maneja todos.
 */
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref<string | null>(null)

async function processCallback() {
  // Caso 1: PKCE — code en query string
  const code = route.query.code as string | undefined
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      status.value = 'error'
      errorMessage.value = error.message
      return
    }
  }

  // Caso 2: implicit flow — tokens en hash fragment
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) {
        status.value = 'error'
        errorMessage.value = error.message
        return
      }
      // Limpia el hash de la URL
      history.replaceState({}, '', window.location.pathname + window.location.search)
    }
  }

  // Caso 3: la sesión ya estaba establecida (supabase-js detectó el token automáticamente)
  // En todos los casos, esperamos a que useSupabaseUser se actualice y redirigimos.
  status.value = 'success'
}

onMounted(processCallback)

watchEffect(async () => {
  if (user.value && status.value === 'success') {
    const next = (route.query.next as string) || '/dashboard'
    await navigateTo(next, { replace: true })
  }
})
</script>

<template>
  <div class="text-center py-8 space-y-3">
    <p v-if="status === 'loading'" class="text-sm text-muted-foreground">
      Procesando magic link…
    </p>
    <p v-else-if="status === 'success' && !user" class="text-sm text-muted-foreground">
      Iniciando sesión…
    </p>
    <p v-else-if="status === 'success' && user" class="text-sm text-muted-foreground">
      ¡Bienvenido! Redirigiendo…
    </p>
    <div v-else-if="status === 'error'" class="space-y-3">
      <p class="text-sm font-medium text-destructive">No se pudo iniciar sesión</p>
      <p class="text-xs text-muted-foreground">{{ errorMessage }}</p>
      <NuxtLink
        to="/auth/login"
        class="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-accent transition"
      >
        Volver al login
      </NuxtLink>
    </div>
  </div>
</template>
