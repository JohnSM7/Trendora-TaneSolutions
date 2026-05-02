<script setup lang="ts">
/**
 * Detalle de una organización (cross-tenant): equipo, drafts, audit, IA.
 */
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const orgId = route.params.id as string

const { data, pending, error } = await useFetch<{
  org: any
  members: Array<{ user_id: string; role: string; created_at: string; accepted_at: string | null; email: string }>
  drafts: Array<{ id: string; title: string | null; body: string; status: string; platforms: string[]; scheduled_at: string | null; published_at: string | null; created_at: string }>
  audit: Array<{ id: string; action: string; target_type: string | null; target_id: string | null; metadata: any; user_id: string | null; created_at: string }>
  generations: Array<{ id: string; generation_type: string; model: string; input_tokens: number | null; output_tokens: number | null; cost_usd: number | null; created_at: string }>
  meter: any
  totalCostUsd: number
}>(`/api/admin/orgs/${orgId}`)

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtCurrency(usd: number) {
  return `$${usd.toFixed(4)}`
}
</script>

<template>
  <div class="p-8 space-y-6 max-w-6xl">
    <NuxtLink to="/admin/orgs" class="text-sm text-zinc-400 hover:text-amber-400">← Todas las orgs</NuxtLink>

    <div v-if="pending && !data" class="text-sm text-zinc-500">Cargando…</div>
    <div v-else-if="error" class="text-sm text-red-400">{{ error?.message }}</div>

    <template v-else-if="data">
      <header class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold">{{ data.org.name }}</h1>
          <p class="text-sm text-zinc-400 font-mono">/{{ data.org.slug }} · plan {{ data.org.plan }}</p>
        </div>
        <NuxtLink
          :to="`/${data.org.slug}/dashboard`"
          target="_blank"
          class="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800"
        >
          Ver como cliente ↗
        </NuxtLink>
      </header>

      <!-- Resumen -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <p class="text-[10px] text-zinc-500 uppercase">Vertical</p>
          <p class="text-sm font-medium mt-1">{{ data.org.vertical ?? '—' }}</p>
        </div>
        <div class="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <p class="text-[10px] text-zinc-500 uppercase">Posts este periodo</p>
          <p class="text-sm font-medium mt-1">{{ data.org.posts_used_this_period }}</p>
        </div>
        <div class="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <p class="text-[10px] text-zinc-500 uppercase">Créditos IA usados</p>
          <p class="text-sm font-medium mt-1">{{ data.org.ai_credits_used_this_period }}</p>
        </div>
        <div class="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <p class="text-[10px] text-zinc-500 uppercase">Coste IA total</p>
          <p class="text-sm font-medium mt-1">${{ data.totalCostUsd.toFixed(4) }}</p>
        </div>
      </div>

      <!-- Equipo -->
      <section class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 class="font-semibold mb-3">Equipo ({{ data.members.length }})</h2>
        <ul class="divide-y divide-zinc-800">
          <li
            v-for="m in data.members"
            :key="m.user_id"
            class="py-2 flex items-center justify-between text-sm"
          >
            <span>{{ m.email }}</span>
            <div class="flex items-center gap-3 text-xs">
              <span class="text-zinc-500 capitalize">{{ m.role }}</span>
              <span :class="m.accepted_at ? 'text-emerald-400' : 'text-amber-400'">
                {{ m.accepted_at ? '✓ aceptó' : '⏳ pendiente' }}
              </span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Drafts recientes -->
      <section class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 class="font-semibold mb-3">Últimos drafts ({{ data.drafts.length }})</h2>
        <div v-if="data.drafts.length === 0" class="text-sm text-zinc-500">Sin drafts.</div>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="d in data.drafts"
            :key="d.id"
            class="border border-zinc-800 rounded p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-zinc-500 font-mono">{{ d.platforms.join(', ') }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded"
                :class="d.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : d.status === 'failed'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-zinc-700 text-zinc-300'"
              >
                {{ d.status }}
              </span>
            </div>
            <p class="text-zinc-300 line-clamp-2">{{ d.body }}</p>
            <p class="text-xs text-zinc-500 mt-1">
              {{ fmtDate(d.published_at ?? d.scheduled_at ?? d.created_at) }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Audit log -->
      <section class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 class="font-semibold mb-3">Audit log (últimos 50)</h2>
        <div v-if="data.audit.length === 0" class="text-sm text-zinc-500">Sin actividad.</div>
        <ul v-else class="space-y-1 text-xs font-mono">
          <li
            v-for="a in data.audit"
            :key="a.id"
            class="flex items-center justify-between gap-3 py-1"
          >
            <span class="text-zinc-500 shrink-0">{{ fmtDate(a.created_at) }}</span>
            <span class="flex-1 truncate text-zinc-300">{{ a.action }}</span>
            <span v-if="a.target_type" class="text-zinc-500 text-[10px]">
              {{ a.target_type }}
            </span>
          </li>
        </ul>
      </section>

      <!-- Generaciones IA -->
      <section class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 class="font-semibold mb-3">Generaciones IA recientes</h2>
        <div v-if="data.generations.length === 0" class="text-sm text-zinc-500">Sin generaciones.</div>
        <table v-else class="w-full text-xs">
          <thead class="text-left text-zinc-500">
            <tr>
              <th class="pb-2 font-medium">Tipo</th>
              <th class="pb-2 font-medium">Modelo</th>
              <th class="pb-2 font-medium text-right">Tokens in</th>
              <th class="pb-2 font-medium text-right">Tokens out</th>
              <th class="pb-2 font-medium text-right">Coste</th>
              <th class="pb-2 font-medium text-right">Cuándo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            <tr v-for="g in data.generations" :key="g.id">
              <td class="py-1.5 capitalize">{{ g.generation_type }}</td>
              <td class="py-1.5 text-zinc-400 font-mono">{{ g.model }}</td>
              <td class="py-1.5 text-right font-mono">{{ g.input_tokens ?? '—' }}</td>
              <td class="py-1.5 text-right font-mono">{{ g.output_tokens ?? '—' }}</td>
              <td class="py-1.5 text-right font-mono">{{ fmtCurrency(Number(g.cost_usd ?? 0)) }}</td>
              <td class="py-1.5 text-right text-zinc-500">{{ fmtDate(g.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
