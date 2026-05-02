<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { CalendarOptions, EventInput, EventDropArg } from '@fullcalendar/core'
import { Button, Card, Badge, Dialog, Label, Input, Select, Textarea } from '@tane/ui'

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
  media: any[]
}

const drafts = ref<Draft[]>([])
const loading = ref(true)
const selectedDraft = ref<Draft | null>(null)
const showDialog = ref(false)

const STATUS_COLORS: Record<string, string> = {
  draft: '#9CA3AF',
  in_review: '#F59E0B',
  approved: '#3B82F6',
  scheduled: '#5B5BD6',
  publishing: '#8B5CF6',
  published: '#00D4A4',
  failed: '#EF4444',
  cancelled: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  approved: 'Aprobado',
  scheduled: 'Programado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Falló',
  cancelled: 'Cancelado',
}

async function loadDrafts() {
  if (!currentOrg.value?.id) return
  loading.value = true
  const { data } = await supabase
    .from('content_drafts')
    .select('id, title, body, status, scheduled_at, platforms, hashtags, media')
    .eq('org_id', currentOrg.value.id)
    .not('scheduled_at', 'is', null)
    .order('scheduled_at')

  drafts.value = (data ?? []) as Draft[]
  loading.value = false
}

watchEffect(() => {
  if (currentOrg.value) loadDrafts()
})

const events = computed<EventInput[]>(() =>
  drafts.value.map((d) => ({
    id: d.id,
    title: d.title || d.body.slice(0, 50),
    start: d.scheduled_at!,
    backgroundColor: STATUS_COLORS[d.status] ?? '#9CA3AF',
    borderColor: STATUS_COLORS[d.status] ?? '#9CA3AF',
    textColor: '#fff',
    extendedProps: { draft: d },
  })),
)

async function onEventDrop(info: EventDropArg) {
  const draft = info.event.extendedProps.draft as Draft
  const newDate = info.event.start?.toISOString()
  if (!newDate) return

  const { error } = await supabase
    .from('content_drafts')
    .update({ scheduled_at: newDate })
    .eq('id', draft.id)

  if (error) {
    toast.error('No se pudo reagendar', error.message)
    info.revert()
    return
  }
  toast.success('Reagendado correctamente')
  await loadDrafts()
}

function onEventClick(info: any) {
  selectedDraft.value = info.event.extendedProps.draft
  showDialog.value = true
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: esLocale,
  firstDay: 1,
  height: 'auto',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
  },
  events: events.value,
  editable: true,
  eventDrop: onEventDrop,
  eventClick: onEventClick,
  nowIndicator: true,
  weekNumbers: false,
}))

async function publishNow() {
  if (!selectedDraft.value) return
  const { error } = await supabase
    .from('content_drafts')
    .update({ scheduled_at: new Date().toISOString(), status: 'scheduled' })
    .eq('id', selectedDraft.value.id)

  if (error) {
    toast.error('No se pudo programar', error.message)
    return
  }
  toast.success('Publicación programada')
  showDialog.value = false
  await loadDrafts()
}

async function cancelDraft() {
  if (!selectedDraft.value) return
  const { error } = await supabase
    .from('content_drafts')
    .update({ status: 'cancelled' })
    .eq('id', selectedDraft.value.id)

  if (error) {
    toast.error('No se pudo cancelar', error.message)
    return
  }
  toast.success('Cancelado')
  showDialog.value = false
  await loadDrafts()
}
</script>

<template>
  <div class="container max-w-7xl py-6">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold">Calendario</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Arrastra los posts para reagendar. Haz clic para editar.
        </p>
      </div>

      <NuxtLink :to="`/${currentOrg?.slug}/studio`">
        <Button>+ Nuevo post</Button>
      </NuxtLink>
    </div>

    <NoSocialAccountsWarning />

    <!-- Leyenda -->
    <Card class="p-4 mb-4">
      <div class="flex flex-wrap items-center gap-4 text-xs">
        <div v-for="(color, status) in STATUS_COLORS" :key="status" class="flex items-center gap-1.5">
          <span class="block h-3 w-3 rounded-full" :style="{ backgroundColor: color }" />
          <span>{{ STATUS_LABELS[status] }}</span>
        </div>
      </div>
    </Card>

    <Card class="p-4 fc-themed">
      <FullCalendar :options="calendarOptions" />
    </Card>

    <!-- Dialog detalle de post -->
    <Dialog
      :open="showDialog"
      :title="selectedDraft?.title ?? 'Post'"
      @update:open="showDialog = $event"
    >
      <div v-if="selectedDraft" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge :style="{ backgroundColor: STATUS_COLORS[selectedDraft.status], color: '#fff' }">
            {{ STATUS_LABELS[selectedDraft.status] }}
          </Badge>
          <Badge v-for="p in selectedDraft.platforms" :key="p" variant="outline">{{ p }}</Badge>
        </div>

        <div>
          <Label class="text-xs uppercase tracking-wide text-muted-foreground">Texto</Label>
          <p class="mt-1 text-sm whitespace-pre-wrap">{{ selectedDraft.body }}</p>
        </div>

        <div v-if="selectedDraft.hashtags?.length">
          <Label class="text-xs uppercase tracking-wide text-muted-foreground">Hashtags</Label>
          <div class="flex flex-wrap gap-1.5 mt-1">
            <Badge v-for="tag in selectedDraft.hashtags" :key="tag" variant="secondary">
              #{{ tag.replace(/^#/, '') }}
            </Badge>
          </div>
        </div>

        <div v-if="selectedDraft.scheduled_at">
          <Label class="text-xs uppercase tracking-wide text-muted-foreground">Programado</Label>
          <p class="mt-1 text-sm">
            {{ new Date(selectedDraft.scheduled_at).toLocaleString('es-ES', {
              dateStyle: 'full',
              timeStyle: 'short',
            }) }}
          </p>
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" class="text-destructive" @click="cancelDraft">Cancelar publicación</Button>
        <Button variant="outline" @click="showDialog = false">Cerrar</Button>
        <Button v-if="selectedDraft && selectedDraft.status === 'draft'" @click="publishNow">
          Programar ahora
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<style>
/* Estiliza FullCalendar para que cuadre con shadcn */
.fc {
  --fc-border-color: hsl(var(--border));
  --fc-button-bg-color: hsl(var(--secondary));
  --fc-button-border-color: hsl(var(--border));
  --fc-button-text-color: hsl(var(--foreground));
  --fc-button-hover-bg-color: hsl(var(--accent));
  --fc-button-hover-border-color: hsl(var(--border));
  --fc-button-active-bg-color: hsl(var(--primary));
  --fc-button-active-border-color: hsl(var(--primary));
  --fc-today-bg-color: hsl(var(--primary) / 0.05);
  --fc-now-indicator-color: hsl(var(--primary));
  font-family: inherit;
}
.fc .fc-button-primary {
  text-transform: none;
  font-weight: 500;
  font-size: 0.875rem;
}
.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}
.fc .fc-event {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.75rem;
}
</style>
