<script setup lang="ts">
/**
 * Lista de todas las organizaciones (cross-tenant).
 */
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface OrgRow {
  id: string
  slug: string
  name: string
  plan: string
  vertical: string | null
  members_count: number
  published_count: number
  drafts_count: number
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  ayrshare_profile_key: string | null
  created_at: string
}

const { data, pending } = await useFetch<{ orgs: OrgRow[]; total: number }>('/api/admin/orgs')

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return data.value?.orgs ?? []
  return (data.value?.orgs ?? []).filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q) ||
      (o.vertical ?? '').toLowerCase().includes(q),
  )
})

function planBadge(plan: string) {
  const map: Record<string, string> = {
    trial: 'bg-zinc-700 text-zinc-200',
    starter: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    pro: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    agency: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    enterprise: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  }
  return map[plan] ?? 'bg-zinc-700 text-zinc-300'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="p-8 space-y-6 max-w-7xl">
    <header class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold">Organizaciones</h1>
        <p class="text-sm text-zinc-400 mt-1">
          {{ data?.total ?? 0 }} {{ data?.total === 1 ? 'org' : 'orgs' }} en la plataforma
        </p>
      </div>
      <input
        v-model="search"
        placeholder="Buscar por nombre, slug o vertical…"
        class="w-72 px-3 py-2 text-sm rounded-md bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:outline-none"
      >
    </header>

    <div v-if="pending && !data?.orgs.length" class="text-sm text-zinc-500">Cargando…</div>

    <div v-else-if="filtered.length === 0" class="text-sm text-zinc-500 py-12 text-center">
      No hay organizaciones que coincidan.
    </div>

    <div v-else class="rounded-lg border border-zinc-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Nombre</th>
            <th class="text-left px-4 py-3 font-medium">Plan</th>
            <th class="text-left px-4 py-3 font-medium">Vertical</th>
            <th class="text-right px-4 py-3 font-medium">Equipo</th>
            <th class="text-right px-4 py-3 font-medium">Posts</th>
            <th class="text-right px-4 py-3 font-medium">Drafts</th>
            <th class="text-left px-4 py-3 font-medium">Ayrshare</th>
            <th class="text-left px-4 py-3 font-medium">Creada</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          <tr
            v-for="org in filtered"
            :key="org.id"
            class="hover:bg-zinc-900/30 cursor-pointer"
            @click="navigateTo(`/admin/orgs/${org.id}`)"
          >
            <td class="px-4 py-3">
              <div class="font-medium">{{ org.name }}</div>
              <div class="text-xs text-zinc-500 font-mono">/{{ org.slug }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="planBadge(org.plan)">
                {{ org.plan }}
              </span>
              <span v-if="org.cancel_at_period_end" class="ml-1 text-[10px] text-amber-400">
                cancela
              </span>
            </td>
            <td class="px-4 py-3 text-zinc-400">{{ org.vertical ?? '—' }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ org.members_count }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ org.published_count }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ org.drafts_count }}</td>
            <td class="px-4 py-3">
              <span v-if="org.ayrshare_profile_key" class="text-emerald-400 text-xs">●&nbsp;Business</span>
              <span v-else class="text-zinc-500 text-xs">— Free</span>
            </td>
            <td class="px-4 py-3 text-zinc-400 text-xs">{{ fmtDate(org.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
