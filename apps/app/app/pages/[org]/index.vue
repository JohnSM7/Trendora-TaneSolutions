<script setup lang="ts">
/**
 * Dashboard cliente — vista resumen de la organización.
 */
definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
const route = useRoute()
const slug = computed(() => route.params.org as string)

interface DashboardData {
  plan: string
  trialDaysLeft: number | null
  kpis: {
    publishedLast30d: number
    publishedDelta: number | null
    scheduledNext7d: number
    pendingApprovals: number
    reach30d: number
    impressions30d: number
    engagements30d: number
    aiCreditsUsed: number
    aiCreditsLimit: number
    aiCreditsPct: number
    postsUsed: number
    postsLimit: number
  }
  timeline: Array<{ date: string; published: number; scheduled: number }>
  upcomingPosts: Array<{
    id: string
    title: string | null
    body: string
    status: string
    scheduled_at: string
    platforms: string[]
  }>
  bestHours: { hours: number[]; peak: { hour: number; count: number } | null }
  socialAccounts: Array<{
    platform: string
    handle: string | null
    display_name: string | null
    status: string
    profile_image_url: string | null
  }>
  brandKits: Array<{ id: string; name: string; is_default: boolean; primary_color: string | null; logo_url: string | null }>
  metricsByPlatform: Record<string, { impressions: number; engagements: number }>
}

const { data, pending } = await useFetch<DashboardData>(() => `/api/orgs/${slug.value}/dashboard`)

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X',
  tiktok: 'TikTok',
  threads: 'Threads',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  gmb: 'Google Business',
  bluesky: 'Bluesky',
}

const PLATFORM_COLOR: Record<string, string> = {
  instagram: 'from-pink-500 to-rose-500',
  facebook: 'from-blue-600 to-blue-500',
  linkedin: 'from-sky-700 to-sky-600',
  twitter: 'from-zinc-900 to-zinc-700',
  tiktok: 'from-zinc-900 to-pink-500',
  threads: 'from-zinc-900 to-zinc-700',
  youtube: 'from-red-600 to-red-500',
  pinterest: 'from-rose-700 to-rose-600',
  gmb: 'from-blue-500 to-emerald-500',
  bluesky: 'from-sky-500 to-cyan-400',
}

function fmtNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH = Math.round(diffMs / (1000 * 60 * 60))
  if (diffH < 24 && diffH >= 0) return `en ${diffH}h`
  if (diffH < 0) return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  return d.toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Madrugando'
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
})

const peakHourLabel = computed(() => {
  if (!data.value?.bestHours.peak) return null
  const h = data.value.bestHours.peak.hour
  return `${String(h).padStart(2, '0')}:00`
})

const heatMax = computed(() => Math.max(1, ...(data.value?.bestHours.hours ?? [1])))

function heatIntensity(value: number) {
  return value / heatMax.value
}

// Sparkline para KPI publicaciones
const publishedSparkline = computed(() =>
  data.value?.timeline.map((d) => d.published) ?? [],
)
const scheduledSparkline = computed(() =>
  data.value?.timeline.map((d) => d.scheduled) ?? [],
)
</script>

<template>
  <div class="container max-w-7xl py-8 space-y-6">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-tane-muted">{{ greeting }} 👋</p>
        <h1 class="text-3xl font-display font-bold mt-1">
          {{ currentOrg?.name ?? 'Organización' }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="data?.plan === 'trial' && data?.trialDaysLeft !== null"
          class="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-medium"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          {{ data.trialDaysLeft }} días de trial restantes
        </span>
        <span
          v-else-if="data?.plan"
          class="inline-flex items-center gap-2 rounded-full bg-tane-primary/10 text-tane-primary px-3 py-1 text-xs font-medium capitalize"
        >
          plan {{ data.plan }}
        </span>
        <NuxtLink
          :to="`/${slug}/studio`"
          class="inline-flex h-9 items-center gap-2 rounded-md bg-tane-primary px-4 text-sm font-medium text-white hover:bg-tane-primary/90 transition shadow"
        >
          ✨ Generar post
        </NuxtLink>
      </div>
    </header>

    <!-- Loading skeleton -->
    <div v-if="pending && !data" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="rounded-xl border bg-card p-5 h-32 animate-pulse" />
    </div>

    <template v-else-if="data">
      <!-- KPI cards con sparklines -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-tane-muted uppercase tracking-wider">Publicados</p>
              <p class="text-3xl font-display font-bold mt-2">{{ data.kpis.publishedLast30d }}</p>
              <p class="text-xs text-tane-muted mt-1">últimos 30 días</p>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-tane-primary/10 text-tane-primary text-lg">
              📤
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <span
              v-if="data.kpis.publishedDelta !== null"
              class="text-xs font-medium"
              :class="data.kpis.publishedDelta >= 0 ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ data.kpis.publishedDelta >= 0 ? '↑' : '↓' }} {{ Math.abs(data.kpis.publishedDelta) }}%
              <span class="text-tane-muted font-normal">vs ant.</span>
            </span>
            <span v-else class="text-xs text-tane-muted">—</span>
            <Sparkline
              :values="publishedSparkline"
              :width="80"
              :height="24"
              stroke="rgb(91, 91, 214)"
              fill="rgb(91, 91, 214)"
            />
          </div>
        </div>

        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-tane-muted uppercase tracking-wider">Programados</p>
              <p class="text-3xl font-display font-bold mt-2">{{ data.kpis.scheduledNext7d }}</p>
              <p class="text-xs text-tane-muted mt-1">próximos 7 días</p>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10 text-violet-600 text-lg">
              📅
            </span>
          </div>
          <div class="mt-3">
            <Sparkline
              :values="scheduledSparkline"
              :width="120"
              :height="24"
              stroke="rgb(168, 85, 247)"
              fill="rgb(168, 85, 247)"
            />
          </div>
        </div>

        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-tane-muted uppercase tracking-wider">Alcance</p>
              <p class="text-3xl font-display font-bold mt-2">{{ fmtNumber(data.kpis.reach30d) }}</p>
              <p class="text-xs text-tane-muted mt-1">{{ fmtNumber(data.kpis.engagements30d) }} interacciones</p>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 text-lg">
              👀
            </span>
          </div>
          <div class="mt-3 text-xs text-tane-muted">
            {{ fmtNumber(data.kpis.impressions30d) }} impresiones
          </div>
        </div>

        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-tane-muted uppercase tracking-wider">Créditos IA</p>
              <p class="text-3xl font-display font-bold mt-2">
                {{ data.kpis.aiCreditsUsed }}
                <span class="text-sm font-normal text-tane-muted">/ {{ data.kpis.aiCreditsLimit }}</span>
              </p>
              <p class="text-xs text-tane-muted mt-1">{{ data.kpis.aiCreditsPct }}% usado</p>
            </div>
            <span class="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600 text-lg">
              ✨
            </span>
          </div>
          <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="data.kpis.aiCreditsPct > 80 ? 'bg-red-500' : 'bg-tane-primary'"
              :style="`width: ${Math.min(100, data.kpis.aiCreditsPct)}%`"
            />
          </div>
        </div>
      </div>

      <!-- Big chart + Próximos posts -->
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border bg-card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-display font-semibold">Actividad</h3>
              <p class="text-xs text-tane-muted">Últimos 14 días</p>
            </div>
            <div class="flex items-center gap-4 text-xs">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-tane-primary"></span>
                Publicado
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-violet-500"></span>
                Programado
              </span>
            </div>
          </div>
          <AreaChart :data="data.timeline" :height="240" />
        </div>

        <!-- Próximos posts timeline -->
        <div class="rounded-xl border bg-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-semibold">Próximos posts</h3>
            <NuxtLink :to="`/${slug}/calendar`" class="text-xs text-tane-primary hover:underline">
              Ver calendario →
            </NuxtLink>
          </div>
          <div v-if="!data.upcomingPosts.length" class="text-center py-10">
            <p class="text-2xl mb-2">🌱</p>
            <p class="text-sm text-tane-muted">No hay posts programados.</p>
            <NuxtLink
              :to="`/${slug}/studio`"
              class="mt-3 inline-flex items-center text-xs text-tane-primary hover:underline"
            >
              Generar uno →
            </NuxtLink>
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="post in data.upcomingPosts.slice(0, 5)"
              :key="post.id"
              class="border-l-2 border-tane-primary/30 pl-3 py-1"
            >
              <p class="text-xs text-tane-primary font-medium">{{ fmtDate(post.scheduled_at) }}</p>
              <p class="text-sm line-clamp-2 mt-1">{{ post.title || post.body }}</p>
              <div class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-for="p in post.platforms"
                  :key="p"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-tane-muted"
                >
                  {{ PLATFORM_LABEL[p] ?? p }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Heatmap horas + Plataformas -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Mejores horas -->
        <div class="rounded-xl border bg-card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-display font-semibold">Mejores horas</h3>
              <p class="text-xs text-tane-muted">
                Cuándo publicas — basado en últimos 30 días
              </p>
            </div>
            <span v-if="peakHourLabel" class="text-xs text-tane-primary font-medium">
              Pico: {{ peakHourLabel }}
            </span>
          </div>
          <div class="grid grid-cols-12 gap-1">
            <div
              v-for="(count, hour) in data.bestHours.hours"
              :key="hour"
              class="aspect-square rounded relative group"
              :style="`background-color: rgba(91, 91, 214, ${heatIntensity(count) * 0.85 + 0.05})`"
              :title="`${String(hour).padStart(2, '0')}:00 — ${count} posts`"
            >
              <span class="absolute inset-0 grid place-items-center text-[9px] font-medium opacity-50 group-hover:opacity-100">
                {{ String(hour).padStart(2, '0') }}
              </span>
            </div>
          </div>
          <p class="text-[10px] text-tane-muted mt-2">
            Cada celda = 1 hora del día (0–23). Color = volumen de publicaciones.
          </p>
        </div>

        <!-- Salud de redes -->
        <div class="rounded-xl border bg-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-semibold">Tus redes</h3>
            <NuxtLink
              :to="`/${slug}/settings/social`"
              class="text-xs text-tane-primary hover:underline"
            >
              Gestionar →
            </NuxtLink>
          </div>
          <div v-if="!data.socialAccounts.length" class="text-center py-6 text-sm text-tane-muted">
            <p class="text-2xl mb-2">🔌</p>
            <p>Aún no hay redes conectadas.</p>
            <NuxtLink
              :to="`/${slug}/settings/social`"
              class="mt-2 inline-block text-xs text-tane-primary hover:underline"
            >
              Solicitar conexión →
            </NuxtLink>
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="acc in data.socialAccounts"
              :key="acc.platform"
              class="flex items-center gap-3"
            >
              <span
                class="grid h-8 w-8 place-items-center rounded-md text-white text-xs font-bold bg-gradient-to-br shrink-0"
                :class="PLATFORM_COLOR[acc.platform] ?? 'from-zinc-500 to-zinc-700'"
              >
                {{ (PLATFORM_LABEL[acc.platform] ?? acc.platform).slice(0, 2) }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ acc.handle ?? PLATFORM_LABEL[acc.platform] ?? acc.platform }}</p>
                <p class="text-[11px] text-tane-muted">{{ data.metricsByPlatform[acc.platform]?.impressions ? fmtNumber(data.metricsByPlatform[acc.platform]!.impressions) + ' impresiones' : '—' }}</p>
              </div>
              <span
                class="h-2 w-2 rounded-full shrink-0"
                :class="acc.status === 'connected' ? 'bg-emerald-500' : 'bg-zinc-400'"
              />
            </li>
          </ul>
        </div>
      </div>

      <!-- Quick actions row -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          :to="`/${slug}/studio`"
          class="rounded-xl border bg-card p-5 hover:border-tane-primary hover:shadow transition group flex items-center gap-3"
        >
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-tane-primary/10 text-tane-primary text-lg">✨</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Generar post</p>
            <p class="text-xs text-tane-muted">Studio IA</p>
          </div>
          <span class="text-tane-muted group-hover:text-tane-primary transition">→</span>
        </NuxtLink>

        <NuxtLink
          :to="`/${slug}/calendar`"
          class="rounded-xl border bg-card p-5 hover:border-tane-primary hover:shadow transition group flex items-center gap-3"
        >
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10 text-violet-600 text-lg">📅</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Calendario</p>
            <p class="text-xs text-tane-muted">{{ data.kpis.scheduledNext7d }} programados</p>
          </div>
          <span class="text-tane-muted group-hover:text-tane-primary transition">→</span>
        </NuxtLink>

        <NuxtLink
          :to="`/${slug}/brand-kits`"
          class="rounded-xl border bg-card p-5 hover:border-tane-primary hover:shadow transition group flex items-center gap-3"
        >
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600 text-lg">🎨</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Brand kits</p>
            <p class="text-xs text-tane-muted">{{ data.brandKits.length }} {{ data.brandKits.length === 1 ? 'kit' : 'kits' }}</p>
          </div>
          <span class="text-tane-muted group-hover:text-tane-primary transition">→</span>
        </NuxtLink>

        <NuxtLink
          :to="`/${slug}/analytics`"
          class="rounded-xl border bg-card p-5 hover:border-tane-primary hover:shadow transition group flex items-center gap-3"
        >
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 text-lg">📊</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Analítica</p>
            <p class="text-xs text-tane-muted">Métricas detalladas</p>
          </div>
          <span class="text-tane-muted group-hover:text-tane-primary transition">→</span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
