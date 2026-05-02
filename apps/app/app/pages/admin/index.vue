<script setup lang="ts">
/**
 * Panel admin Tane — home con KPIs cross-tenant + timeline + top orgs.
 */
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface Summary {
  totals: {
    orgs: number
    newOrgs30d: number
    mrrEur: number
    postsPublished30d: number
    aiCostUsd30d: number
    pendingConnectionRequests: number
  }
  orgsByPlan: Record<string, number>
  generationsByType: Record<string, number>
  timeline: Array<{ date: string; newOrgs: number; published: number }>
  topByPosts: Array<{ id: string; slug: string; name: string; plan: string; count: number }>
  topByCost: Array<{ id: string; slug: string; name: string; plan: string; costUsd: number }>
  activityFeed: Array<{
    id: string
    action: string
    targetType: string | null
    metadata: any
    createdAt: string
    orgSlug: string | null
    orgName: string | null
  }>
}

const { data, pending, error, refresh } = await useFetch<Summary>('/api/admin/summary')

function fmtRelative(iso: string) {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const days = Math.floor(h / 24)
  return `hace ${days}d`
}

function actionLabel(a: string) {
  const map: Record<string, string> = {
    'social.connection_requested': '📥 Solicitud de conexión',
    'post.publish.failed': '❌ Publicación falló',
    'billing.payment_succeeded': '💳 Pago recibido',
    'billing.payment_failed': '⚠️ Pago falló',
    'billing.subscription_created': '🎉 Nueva suscripción',
    'billing.subscription_canceled': '👋 Cancelación',
    'org.created': '🏢 Org creada',
    'user.invited': '✉️ Invitación enviada',
  }
  return map[a] ?? a
}

const planColors: Record<string, string> = {
  trial: 'bg-zinc-700 text-zinc-200',
  starter: 'bg-blue-500/20 text-blue-300',
  pro: 'bg-violet-500/20 text-violet-300',
  agency: 'bg-amber-500/20 text-amber-300',
  enterprise: 'bg-emerald-500/20 text-emerald-300',
}
</script>

<template>
  <div class="p-8 space-y-8 max-w-7xl">
    <header class="flex items-end justify-between">
      <div>
        <p class="text-xs uppercase tracking-wider text-amber-400 mb-1">Panel Tane Solutions</p>
        <h1 class="text-3xl font-display font-bold">Resumen de plataforma</h1>
        <p class="text-sm text-zinc-400 mt-1">Vista cross-tenant. Datos de los últimos 30 días.</p>
      </div>
      <button
        :disabled="pending"
        class="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 transition"
        @click="() => refresh()"
      >
        {{ pending ? 'Actualizando…' : '↻ Actualizar' }}
      </button>
    </header>

    <p v-if="error" class="text-sm text-red-400">Error cargando: {{ error?.message }}</p>

    <template v-if="data">
      <!-- HERO KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-5 hover:border-amber-500/30 transition">
          <div class="flex items-start justify-between">
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Organizaciones</p>
            <span class="text-base">🏢</span>
          </div>
          <p class="text-3xl font-display font-bold mt-2">{{ data.totals.orgs }}</p>
          <p class="text-xs text-emerald-400 mt-1">
            +{{ data.totals.newOrgs30d }} <span class="text-zinc-500 font-normal">en 30d</span>
          </p>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-5 hover:border-amber-500/30 transition">
          <div class="flex items-start justify-between">
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider">MRR estimado</p>
            <span class="text-base">💶</span>
          </div>
          <p class="text-3xl font-display font-bold mt-2">{{ data.totals.mrrEur }}€</p>
          <p class="text-xs text-zinc-500 mt-1">{{ Math.round(data.totals.mrrEur * 12) }}€ ARR</p>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-5 hover:border-amber-500/30 transition">
          <div class="flex items-start justify-between">
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Posts publicados</p>
            <span class="text-base">📤</span>
          </div>
          <p class="text-3xl font-display font-bold mt-2">{{ data.totals.postsPublished30d }}</p>
          <p class="text-xs text-zinc-500 mt-1">últimos 30d</p>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-5 hover:border-amber-500/30 transition">
          <div class="flex items-start justify-between">
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Coste IA</p>
            <span class="text-base">✨</span>
          </div>
          <p class="text-3xl font-display font-bold mt-2">${{ data.totals.aiCostUsd30d.toFixed(2) }}</p>
          <p class="text-xs text-zinc-500 mt-1">últimos 30d · OpenAI</p>
        </div>

        <NuxtLink
          to="/admin/connection-requests"
          class="rounded-xl p-5 transition block"
          :class="data.totals.pendingConnectionRequests > 0
            ? 'border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15'
            : 'border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 hover:border-amber-500/30'"
        >
          <div class="flex items-start justify-between">
            <p class="text-[10px] uppercase tracking-wider"
              :class="data.totals.pendingConnectionRequests > 0 ? 'text-amber-400' : 'text-zinc-500'"
            >
              Solicitudes
            </p>
            <span class="text-base">📥</span>
          </div>
          <p class="text-3xl font-display font-bold mt-2">{{ data.totals.pendingConnectionRequests }}</p>
          <p class="text-xs mt-1"
            :class="data.totals.pendingConnectionRequests > 0 ? 'text-amber-400' : 'text-zinc-500'">
            {{ data.totals.pendingConnectionRequests > 0 ? 'Ver cola →' : 'cola vacía' }}
          </p>
        </NuxtLink>
      </div>

      <!-- BIG TIMELINE CHART -->
      <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-display font-semibold">Actividad cross-tenant</h3>
            <p class="text-xs text-zinc-500">Posts publicados + nuevas orgs · últimos 30 días</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2 w-3 rounded-sm bg-amber-500"></span>
              Posts publicados
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-0.5 w-3 bg-tane-primary"></span>
              Orgs nuevas
            </span>
          </div>
        </div>
        <AdminTimelineChart :data="data.timeline" />
      </div>

      <!-- TOP ORGS GRID -->
      <div class="grid lg:grid-cols-2 gap-4">
        <!-- Top by activity -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-semibold">🔥 Top por actividad</h3>
            <span class="text-xs text-zinc-500">posts/30d</span>
          </div>
          <div v-if="!data.topByPosts.length" class="text-sm text-zinc-500 py-8 text-center">
            Aún sin actividad de publicación.
          </div>
          <ol v-else class="space-y-2">
            <li
              v-for="(o, i) in data.topByPosts"
              :key="o!.id"
              class="flex items-center gap-3 p-2 rounded hover:bg-zinc-800/50 transition"
            >
              <span class="text-zinc-500 font-mono text-xs w-5">{{ i + 1 }}</span>
              <NuxtLink :to="`/admin/orgs/${o!.id}`" class="flex-1 min-w-0 hover:text-amber-400">
                <p class="text-sm font-medium truncate">{{ o!.name }}</p>
                <p class="text-[10px] text-zinc-500 font-mono">/{{ o!.slug }}</p>
              </NuxtLink>
              <span class="text-[10px] px-2 py-0.5 rounded shrink-0" :class="planColors[o!.plan] ?? planColors.trial">
                {{ o!.plan }}
              </span>
              <span class="text-base font-mono font-semibold text-amber-400 w-10 text-right">{{ o!.count }}</span>
            </li>
          </ol>
        </div>

        <!-- Top by AI cost -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-semibold">💸 Top por gasto IA</h3>
            <span class="text-xs text-zinc-500">USD/30d</span>
          </div>
          <div v-if="!data.topByCost.length" class="text-sm text-zinc-500 py-8 text-center">
            Aún sin generaciones IA.
          </div>
          <ol v-else class="space-y-2">
            <li
              v-for="(o, i) in data.topByCost"
              :key="o!.id"
              class="flex items-center gap-3 p-2 rounded hover:bg-zinc-800/50 transition"
            >
              <span class="text-zinc-500 font-mono text-xs w-5">{{ i + 1 }}</span>
              <NuxtLink :to="`/admin/orgs/${o!.id}`" class="flex-1 min-w-0 hover:text-amber-400">
                <p class="text-sm font-medium truncate">{{ o!.name }}</p>
                <p class="text-[10px] text-zinc-500 font-mono">/{{ o!.slug }}</p>
              </NuxtLink>
              <span class="text-[10px] px-2 py-0.5 rounded shrink-0" :class="planColors[o!.plan] ?? planColors.trial">
                {{ o!.plan }}
              </span>
              <span class="text-base font-mono font-semibold text-emerald-400 w-16 text-right">${{ o!.costUsd.toFixed(3) }}</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- DISTRIBUTION + ACTIVITY FEED -->
      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Plan distribution -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 class="font-display font-semibold mb-4">Distribución por plan</h3>
          <div v-if="Object.keys(data.orgsByPlan).length === 0" class="text-sm text-zinc-500 py-4">
            Sin datos.
          </div>
          <ul v-else class="space-y-3 text-sm">
            <li
              v-for="(count, plan) in data.orgsByPlan"
              :key="plan"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="capitalize text-zinc-300">{{ plan }}</span>
                <span class="font-mono text-zinc-300">{{ count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="plan === 'trial' ? 'bg-zinc-500' : plan === 'starter' ? 'bg-blue-500' : plan === 'pro' ? 'bg-violet-500' : plan === 'agency' ? 'bg-amber-500' : 'bg-emerald-500'"
                  :style="`width: ${(count / data.totals.orgs) * 100}%`"
                />
              </div>
            </li>
          </ul>
        </div>

        <!-- Activity feed -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-semibold">Actividad reciente</h3>
            <span class="text-xs text-zinc-500">cross-tenant · últimas 30</span>
          </div>
          <div v-if="!data.activityFeed.length" class="text-sm text-zinc-500 py-4 text-center">
            Sin actividad.
          </div>
          <ul v-else class="space-y-1 max-h-96 overflow-auto -mx-2">
            <li
              v-for="event in data.activityFeed"
              :key="event.id"
              class="flex items-center gap-3 px-2 py-2 rounded hover:bg-zinc-800/50 transition text-xs"
            >
              <span class="text-zinc-500 shrink-0 w-16 font-mono">{{ fmtRelative(event.createdAt) }}</span>
              <span class="flex-1 min-w-0 truncate">{{ actionLabel(event.action) }}</span>
              <NuxtLink
                v-if="event.orgSlug"
                :to="`/admin/orgs/${event.orgSlug}`"
                class="text-amber-400/80 hover:text-amber-400 truncate max-w-[180px] font-mono"
              >
                {{ event.orgName }}
              </NuxtLink>
              <span v-else class="text-zinc-600 font-mono">—</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Generations by type pill bar -->
      <div v-if="Object.keys(data.generationsByType).length" class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 class="font-display font-semibold mb-4">Generaciones IA (30d)</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          <span
            v-for="(count, type) in data.generationsByType"
            :key="type"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700"
          >
            <span class="capitalize text-zinc-300">{{ type }}</span>
            <span class="font-mono text-amber-400">{{ count }}</span>
          </span>
        </div>
      </div>
    </template>

    <div v-if="pending && !data" class="text-sm text-zinc-500">Cargando KPIs…</div>
  </div>
</template>
