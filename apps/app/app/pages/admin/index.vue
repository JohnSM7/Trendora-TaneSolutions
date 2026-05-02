<script setup lang="ts">
/**
 * Panel admin Tane — home con KPIs cross-tenant.
 */
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface Summary {
  totals: {
    orgs: number
    mrrEur: number
    postsPublished30d: number
    aiCostUsd30d: number
    pendingConnectionRequests: number
  }
  orgsByPlan: Record<string, number>
  generationsByType: Record<string, number>
}

const { data, pending, error, refresh } = await useFetch<Summary>('/api/admin/summary')
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

    <p v-if="error" class="text-sm text-red-400">
      Error cargando: {{ error?.message }}
    </p>

    <!-- KPIs principales -->
    <div v-if="data" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Organizaciones</p>
        <p class="text-3xl font-bold">{{ data.totals.orgs }}</p>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">MRR estimado</p>
        <p class="text-3xl font-bold">{{ data.totals.mrrEur }}€</p>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Posts publicados (30d)</p>
        <p class="text-3xl font-bold">{{ data.totals.postsPublished30d }}</p>
      </div>
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Coste IA (30d)</p>
        <p class="text-3xl font-bold">${{ data.totals.aiCostUsd30d.toFixed(2) }}</p>
      </div>
      <div
        class="rounded-lg p-5"
        :class="data.totals.pendingConnectionRequests > 0
          ? 'border border-amber-500/40 bg-amber-500/5'
          : 'border border-zinc-800 bg-zinc-900/50'"
      >
        <p class="text-xs uppercase tracking-wider mb-1"
          :class="data.totals.pendingConnectionRequests > 0 ? 'text-amber-400' : 'text-zinc-500'">
          Solicitudes pendientes
        </p>
        <p class="text-3xl font-bold">{{ data.totals.pendingConnectionRequests }}</p>
        <NuxtLink
          v-if="data.totals.pendingConnectionRequests > 0"
          to="/admin/connection-requests"
          class="text-xs text-amber-400 hover:underline mt-1 inline-block"
        >
          Ver cola →
        </NuxtLink>
      </div>
    </div>

    <!-- Distribución por plan + tipos generación -->
    <div v-if="data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 class="text-sm font-semibold mb-4">Orgs por plan</h3>
        <div v-if="Object.keys(data.orgsByPlan).length === 0" class="text-sm text-zinc-500">
          Sin datos.
        </div>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="(count, plan) in data.orgsByPlan"
            :key="plan"
            class="flex items-center justify-between"
          >
            <span class="capitalize">{{ plan }}</span>
            <span class="font-mono text-zinc-300">{{ count }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 class="text-sm font-semibold mb-4">Generaciones IA (30d)</h3>
        <div v-if="Object.keys(data.generationsByType).length === 0" class="text-sm text-zinc-500">
          Aún sin generaciones.
        </div>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="(count, type) in data.generationsByType"
            :key="type"
            class="flex items-center justify-between"
          >
            <span class="capitalize">{{ type }}</span>
            <span class="font-mono text-zinc-300">{{ count }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="pending && !data" class="text-sm text-zinc-500">Cargando KPIs…</div>
  </div>
</template>
