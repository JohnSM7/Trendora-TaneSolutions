<script setup lang="ts">
import { Button, Card, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from '@tane/ui'

definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
const supabase = useDb()
const toast = useToast()

interface Draft {
  id: string
  title: string | null
  body: string
  status: string
  scheduled_at: string | null
  platforms: string[]
  hashtags: string[] | null
  created_at: string
  updated_at: string
}

const drafts = ref<Draft[]>([])
const loading = ref(true)
const filter = ref<'all' | 'draft' | 'in_review' | 'scheduled' | 'published' | 'failed'>('all')

async function loadDrafts() {
  if (!currentOrg.value?.id) return
  loading.value = true

  let q = supabase
    .from('content_drafts')
    .select('id, title, body, status, scheduled_at, platforms, hashtags, created_at, updated_at')
    .eq('org_id', currentOrg.value.id)
    .order('updated_at', { ascending: false })

  if (filter.value !== 'all') q = q.eq('status', filter.value)

  const { data } = await q
  drafts.value = (data ?? []) as Draft[]
  loading.value = false
}

watchEffect(() => {
  if (currentOrg.value) loadDrafts()
})

watch(filter, loadDrafts)

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  in_review: { label: 'En revisión', variant: 'warning' },
  approved: { label: 'Aprobado', variant: 'default' },
  scheduled: { label: 'Programado', variant: 'default' },
  publishing: { label: 'Publicando', variant: 'default' },
  published: { label: 'Publicado', variant: 'success' },
  failed: { label: 'Falló', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' },
}

function statusOf(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const }
}

const counts = computed(() => {
  const c: Record<string, number> = { all: drafts.value.length }
  for (const d of drafts.value) c[d.status] = (c[d.status] ?? 0) + 1
  return c
})

async function deleteDraft(d: Draft) {
  if (!confirm(`¿Borrar "${d.title || d.body.slice(0, 40)}"? Esta acción no se puede deshacer.`)) return
  const { error } = await supabase.from('content_drafts').delete().eq('id', d.id)
  if (error) {
    toast.error('No se pudo borrar', error.message)
    return
  }
  toast.success('Borrador eliminado')
  await loadDrafts()
}

function preview(d: Draft) {
  return d.title || d.body.slice(0, 80)
}
</script>

<template>
  <div class="container max-w-6xl py-6">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold">Borradores</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Todo el contenido generado, en cualquier estado.
        </p>
      </div>
      <NuxtLink :to="`/${currentOrg?.slug}/studio`">
        <Button>+ Nuevo post</Button>
      </NuxtLink>
    </div>

    <Tabs v-model="filter" class="mb-4">
      <TabsList>
        <TabsTrigger value="all">Todos ({{ counts.all ?? 0 }})</TabsTrigger>
        <TabsTrigger value="draft">Borradores ({{ counts.draft ?? 0 }})</TabsTrigger>
        <TabsTrigger value="in_review">En revisión ({{ counts.in_review ?? 0 }})</TabsTrigger>
        <TabsTrigger value="scheduled">Programados ({{ counts.scheduled ?? 0 }})</TabsTrigger>
        <TabsTrigger value="published">Publicados ({{ counts.published ?? 0 }})</TabsTrigger>
      </TabsList>
    </Tabs>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 3" :key="i" class="h-24" />
    </div>

    <Card v-else-if="!drafts.length" class="p-10 text-center">
      <p class="text-muted-foreground mb-4">
        {{ filter === 'all' ? 'Aún no hay borradores. Crea tu primer post desde Studio.' : 'No hay posts en este estado.' }}
      </p>
      <NuxtLink :to="`/${currentOrg?.slug}/studio`">
        <Button>Ir al Studio</Button>
      </NuxtLink>
    </Card>

    <div v-else class="space-y-3">
      <Card v-for="d in drafts" :key="d.id" class="p-4">
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <Badge :variant="statusOf(d.status).variant">
                {{ statusOf(d.status).label }}
              </Badge>
              <Badge v-for="p in d.platforms" :key="p" variant="outline">{{ p }}</Badge>
              <span v-if="d.scheduled_at" class="text-xs text-muted-foreground">
                · Programado {{ new Date(d.scheduled_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }}
              </span>
            </div>
            <p class="text-sm font-medium truncate">{{ preview(d) }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              Actualizado {{ new Date(d.updated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive shrink-0"
            @click="deleteDraft(d)"
          >
            Borrar
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
