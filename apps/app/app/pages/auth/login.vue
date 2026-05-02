<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const route = useRoute()
const config = useRuntimeConfig()

const email = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

async function sendMagicLink() {
  if (!email.value) return
  sending.value = true
  error.value = null
  const next = (route.query.next as string) || '/dashboard'
  const { error: e } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: `${config.public.appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  sending.value = false
  if (e) {
    error.value = e.message
    return
  }
  sent.value = true
}
</script>

<template>
  <div>
    <h1 class="text-xl font-display font-semibold mb-2">Entra en tu cuenta</h1>
    <p class="text-sm text-tane-muted mb-6">
      Te enviamos un enlace mágico al email. Sin contraseñas que recordar.
    </p>

    <form v-if="!sent" class="space-y-4" @submit.prevent="sendMagicLink">
      <div>
        <label class="text-sm font-medium" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="tu@email.com"
          class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tane-primary/20"
        />
      </div>

      <button
        type="submit"
        :disabled="sending"
        class="w-full rounded-md bg-tane-primary px-4 py-2 text-sm font-medium text-white hover:bg-tane-primary/90 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
      >
        {{ sending ? 'Enviando…' : 'Enviarme el enlace' }}
      </button>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </form>

    <div v-else class="rounded-lg border bg-tane-accent/5 p-4 text-sm">
      <p class="font-medium mb-1">Revisa tu bandeja de entrada</p>
      <p class="text-tane-muted">
        Te hemos enviado un enlace a <strong>{{ email }}</strong>. Haz clic para entrar.
      </p>
    </div>
  </div>
</template>
