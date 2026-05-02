<script setup lang="ts">
/**
 * Cola de solicitudes "Solicitar conexión" pendientes en Modo Free Ayrshare.
 * El equipo Tane procesa esta cola — ver `docs/CLIENT_ONBOARDING.md`.
 */
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface ConnectionRequest {
  id: string
  requestedAt: string
  org: { id: string; slug: string; name: string; plan: string; vertical: string | null }
  userEmail: string
  requestedPlatforms: string[]
  notes: string | null
}

const { data, pending, refresh } = await useFetch<{ requests: ConnectionRequest[] }>(
  '/api/admin/connection-requests',
)

function fmtDate(iso: string) {
  const date = new Date(iso)
  const now = Date.now()
  const diffH = Math.floor((now - date.getTime()) / (1000 * 60 * 60))
  if (diffH < 1) return 'hace minutos'
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}

function mailto(req: ConnectionRequest) {
  const subject = encodeURIComponent(`Re: Conectar redes para ${req.org.name}`)
  const body = encodeURIComponent(
    `¡Hola!\n\nGracias por solicitar la conexión de tus redes a Trendora. Vamos a agendar 15 minutos para configurarlas juntos.\n\nElige hueco aquí: https://cal.com/tane/trendora-onboarding\n\nUn abrazo,\nTane`,
  )
  return `mailto:${req.userEmail}?subject=${subject}&body=${body}`
}
</script>

<template>
  <div class="p-8 space-y-6 max-w-5xl">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-display font-bold">Solicitudes de conexión</h1>
        <p class="text-sm text-zinc-400 mt-1">
          Clientes esperando que Tane configure sus redes en Ayrshare.
        </p>
      </div>
      <button
        :disabled="pending"
        class="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 transition"
        @click="() => refresh()"
      >
        {{ pending ? 'Actualizando…' : '↻ Actualizar' }}
      </button>
    </header>

    <div v-if="pending && !data?.requests.length" class="text-sm text-zinc-500">Cargando…</div>

    <div
      v-else-if="!data || data.requests.length === 0"
      class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center"
    >
      <p class="text-2xl mb-2">🎉</p>
      <p class="font-semibold">Cola vacía</p>
      <p class="text-sm text-zinc-400 mt-1">
        Nada pendiente — todos los clientes están conectados o no han solicitado nada nuevo.
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="req in data?.requests"
        :key="req.id"
        class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <NuxtLink
                :to="`/admin/orgs/${req.org.id}`"
                class="font-semibold hover:text-amber-400"
              >
                {{ req.org.name }}
              </NuxtLink>
              <span class="text-xs text-zinc-500 font-mono">/{{ req.org.slug }}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {{ req.org.plan }}
              </span>
            </div>
            <p class="text-sm text-zinc-300 mb-1">
              <a :href="`mailto:${req.userEmail}`" class="hover:text-amber-400">{{ req.userEmail }}</a>
            </p>
            <p v-if="req.requestedPlatforms.length" class="text-xs text-zinc-500">
              Pide: <span class="text-zinc-300">{{ req.requestedPlatforms.join(', ') }}</span>
            </p>
            <p v-if="req.notes" class="text-xs text-zinc-400 mt-2 italic">{{ req.notes }}</p>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="text-xs text-zinc-500">{{ fmtDate(req.requestedAt) }}</span>
            <a
              :href="mailto(req)"
              class="text-xs px-3 py-1.5 rounded-md bg-amber-500 text-zinc-950 font-medium hover:bg-amber-400"
            >
              ✉️ Responder
            </a>
            <a
              href="https://app.ayrshare.com/social-accounts"
              target="_blank"
              class="text-xs text-zinc-400 hover:text-amber-400"
            >
              Abrir Ayrshare ↗
            </a>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
