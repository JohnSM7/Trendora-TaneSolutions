<script setup lang="ts">
import { Card, Select, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from '@tane/ui'
import KpiCard from '~/components/analytics/KpiCard.vue'
import BarChart from '~/components/analytics/BarChart.vue'
import LineChart from '~/components/analytics/LineChart.vue'

definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
const supabase = useDb()

const range = ref<'7d' | '30d' | '90d' | '12m'>('30d')
const platformFilter = ref<string>('all')
const loading = ref(true)

interface MetricsRow {
  draft_id: string
  platform: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  clicks: number
  fetched_at: string
  draft: {
    title: string | null
    body: string
    published_at: string | null
  }
}

const metrics = ref<MetricsRow[]>([])

async function load() {
  if (!currentOrg.value?.id) return
  loading.value = true

  const since = new Date()
  if (range.value === '7d') since.setDate(since.getDate() - 7)
  if (range.value === '30d') since.setDate(since.getDate() - 30)
  if (range.value === '90d') since.setDate(since.getDate() - 90)
  if (range.value === '12m') since.setMonth(since.getMonth() - 12)

  let q = supabase
    .from('post_metrics')
    .select(`
      draft_id, platform, impressions, reach, likes, comments, shares, clicks, fetched_at,
      draft:content_drafts(title, body, published_at)
    `)
    .eq('org_id', currentOrg.value.id)
    .gte('fetched_at', since.toISOString())
    .order('fetched_at', { ascending: false })

  if (platformFilter.value !== 'all') q = q.eq('platform', platformFilter.value)

  const { data } = await q
  metrics.value = (data ?? []) as unknown as MetricsRow[]
  loading.value = false
}

watchEffect(() => {
  if (currentOrg.value) load()
})

watch([range, platformFilter], load)

const totals = computed(() => {
  return metrics.value.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions ?? 0),
      reach: acc.reach + (m.reach ?? 0),
      likes: acc.likes + (m.likes ?? 0),
      comments: acc.comments + (m.comments ?? 0),
      shares: acc.shares + (m.shares ?? 0),
      clicks: acc.clicks + (m.clicks ?? 0),
    }),
    { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0 },
  )
})

const engagementRate = computed(() => {
  if (!totals.value.impressions) return 0
  return (
    (totals.value.likes + totals.value.comments + totals.value.shares) / totals.value.impressions
  )
})

// Datos para charts: agregados por día
const byDay = computed(() => {
  const buckets: Record<string, number> = {}
  for (const m of metrics.value) {
    const day = m.fetched_at.slice(0, 10)
    buckets[day] = (buckets[day] ?? 0) + (m.impressions ?? 0)
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, value]) => ({
      label: new Date(day).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      value,
    }))
})

const byPlatform = computed(() => {
  const buckets: Record<string, number> = {}
  for (const m of metrics.value) {
    buckets[m.platform] = (buckets[m.platform] ?? 0) + (m.impressions ?? 0)
  }
  return Object.entries(buckets).map(([label, value]) => ({ label, value }))
})

const topPosts = computed(() => {
  const grouped: Record<
    string,
    { id: string; title: string; impressions: number; engagement: number }
  > = {}
  for (const m of metrics.value) {
    if (!m.draft) continue
    const key = m.draft_id
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        title: m.draft.title ?? m.draft.body.slice(0, 60),
        impressions: 0,
        engagement: 0,
      }
    }
    grouped[key]!.impressions += m.impressions ?? 0
    grouped[key]!.engagement += (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0)
  }
  return Object.values(grouped)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5)
})
</script>

<template>
  <div class="container max-w-7xl py-6">
    <div class="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-display font-bold">Analítica</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Métricas reales de tus publicaciones por plataforma.
        </p>
      </div>

      <div class="flex gap-2">
        <Select
          v-model="platformFilter"
          :options="[
            { value: 'all', label: 'Todas las plataformas' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'twitter', label: 'X' },
            { value: 'tiktok', label: 'TikTok' },
          ]"
        />
        <Select
          v-model="range"
          :options="[
            { value: '7d', label: 'Últimos 7 días' },
            { value: '30d', label: 'Últimos 30 días' },
            { value: '90d', label: 'Últimos 90 días' },
            { value: '12m', label: 'Últimos 12 meses' },
          ]"
        />
      </div>
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Skeleton v-for="i in 6" :key="i" class="h-28" />
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <KpiCard label="Impresiones" :value="totals.impressions" format="compact" />
        <KpiCard label="Alcance" :value="totals.reach" format="compact" />
        <KpiCard label="Likes" :value="totals.likes" format="compact" />
        <KpiCard label="Comentarios" :value="totals.comments" format="compact" />
        <KpiCard label="Compartidos" :value="totals.shares" format="compact" />
        <KpiCard label="Engagement" :value="engagementRate" format="percent" />
      </div>

      <!-- Charts -->
      <div class="grid gap-6 lg:grid-cols-2 mb-6">
        <Card class="p-6">
          <h3 class="font-display font-semibold mb-1">Impresiones en el tiempo</h3>
          <p class="text-xs text-muted-foreground mb-4">
            Suma diaria de impresiones de todos los posts.
          </p>
          <LineChart :data="byDay" :height="200" />
        </Card>

        <Card class="p-6">
          <h3 class="font-display font-semibold mb-1">Por plataforma</h3>
          <p class="text-xs text-muted-foreground mb-4">
            Reparto de impresiones por red.
          </p>
          <BarChart :data="byPlatform" :height="200" />
        </Card>
      </div>

      <!-- Top posts -->
      <Card class="p-6">
        <h3 class="font-display font-semibold mb-4">Top 5 posts por engagement</h3>
        <div v-if="!topPosts.length" class="text-sm text-muted-foreground text-center py-8">
          Aún no hay suficientes datos. Las métricas se actualizan cada 6 horas.
        </div>
        <div v-else class="divide-y">
          <div
            v-for="(p, i) in topPosts"
            :key="p.id"
            class="py-3 flex items-center gap-4"
          >
            <span class="text-2xl font-display font-bold text-muted-foreground w-8">
              #{{ i + 1 }}
            </span>
            <p class="flex-1 text-sm truncate">{{ p.title }}</p>
            <div class="flex gap-4 text-xs">
              <span><strong>{{ p.impressions.toLocaleString() }}</strong> impr.</span>
              <span><strong>{{ p.engagement.toLocaleString() }}</strong> interac.</span>
            </div>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
