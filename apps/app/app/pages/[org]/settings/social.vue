<script setup lang="ts">
import { Button, Card, Badge, Avatar, Skeleton, Alert, Separator } from '@tane/ui'

const { currentOrg } = useCurrentOrg()
const toast = useToast()

interface ConnectedAccount {
  platform: string
  handle: string | null
  displayName: string | null
  profileImageUrl: string | null
  profileUrl: string | null
  type: string | null
  status: 'connected'
}

interface ListResponse {
  mode: 'free' | 'business' | 'unconfigured'
  accounts: ConnectedAccount[]
  quota?: { used: number; limit: number | null }
  primaryEmail?: string | null
  error?: string
  message?: string
}

const data = ref<ListResponse | null>(null)
const loading = ref(true)
const refreshing = ref(false)

const PLATFORM_INFO: Record<
  string,
  { label: string; icon: string; color: string; connectGuide?: string }
> = {
  instagram: {
    label: 'Instagram',
    icon: '📷',
    color: '#E1306C',
    connectGuide: 'Necesita una página de Facebook conectada (Instagram Business).',
  },
  facebook: {
    label: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    connectGuide: 'Conecta una página de Facebook (no perfil personal).',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    connectGuide: 'Página de empresa o perfil personal.',
  },
  twitter: {
    label: 'X / Twitter',
    icon: '𝕏',
    color: '#000',
    connectGuide: 'Cuenta personal o de marca.',
  },
  tiktok: {
    label: 'TikTok',
    icon: '♪',
    color: '#FE2C55',
    connectGuide: 'TikTok Business account.',
  },
  youtube: {
    label: 'YouTube',
    icon: '▶',
    color: '#FF0000',
    connectGuide: 'Canal de YouTube.',
  },
  pinterest: {
    label: 'Pinterest',
    icon: 'P',
    color: '#BD081C',
    connectGuide: 'Cuenta de Pinterest Business.',
  },
  threads: {
    label: 'Threads',
    icon: '@',
    color: '#000',
    connectGuide: 'Conectada vía Instagram.',
  },
  bluesky: {
    label: 'Bluesky',
    icon: '☁',
    color: '#0085FF',
    connectGuide: 'Cuenta de Bluesky con app password.',
  },
  gmb: {
    label: 'Google Business Profile',
    icon: 'G',
    color: '#4285F4',
    connectGuide: 'Ficha de empresa en Google.',
  },
}

async function load() {
  if (!currentOrg.value?.slug) return
  loading.value = true
  try {
    data.value = await $fetch<ListResponse>('/api/social/list', {
      query: { orgSlug: currentOrg.value.slug },
    })
  } catch (e: any) {
    toast.error('No se pudieron cargar las cuentas', e?.data?.message ?? e.message)
    data.value = null
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  if (currentOrg.value) load()
})

async function refresh() {
  refreshing.value = true
  await load()
  refreshing.value = false
  if (data.value?.accounts.length) {
    toast.success(`${data.value.accounts.length} red${data.value.accounts.length === 1 ? '' : 'es'} conectada${data.value.accounts.length === 1 ? '' : 's'}`)
  }
}

const connectedSet = computed(() => new Set(data.value?.accounts.map((a) => a.platform) ?? []))
const isFree = computed(() => data.value?.mode === 'free')
const isBusiness = computed(() => data.value?.mode === 'business')

function openAyrshareDashboard() {
  window.open('https://app.ayrshare.com/social-accounts', '_blank', 'noopener')
}

const requesting = ref(false)
async function emailFounder() {
  if (!currentOrg.value?.slug) return
  requesting.value = true

  // 1. Registrar la solicitud en BD (best-effort) y notificar al equipo Tane via Resend.
  //    Si esto falla no bloquea: el cliente puede mandar el email igualmente.
  try {
    await $fetch('/api/social/connection-request', {
      method: 'POST',
      body: {
        orgSlug: currentOrg.value.slug,
        platforms: [],
      },
    })
    toast.success('Solicitud registrada', 'Te contactaremos en menos de 12h.')
  } catch (e: any) {
    if (e?.statusCode === 429) {
      toast.info('Solicitud ya en cola', 'Ya tienes una solicitud pendiente.')
    } else {
      console.warn('[social] tracking falló:', e)
    }
  } finally {
    requesting.value = false
  }

  // 2. Abrir el cliente de email del usuario con plantilla pre-rellenada
  const subject = encodeURIComponent(`[Trendora] Conectar redes para ${currentOrg.value.name}`)
  const body = encodeURIComponent(
    `Hola,\n\nQuiero conectar las siguientes redes a mi cuenta Trendora "${currentOrg.value.name}":\n\n- Instagram: @____\n- Facebook: ____\n- LinkedIn: ____\n\nGracias.`,
  )
  window.location.href = `mailto:hola@tanesolutions.com?subject=${subject}&body=${body}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h2 class="text-2xl font-display font-bold">Redes sociales</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Las redes que Trendora usará para publicar tu contenido.
        </p>
      </div>
      <Button variant="outline" :disabled="refreshing" @click="refresh">
        {{ refreshing ? 'Actualizando…' : '↻ Actualizar' }}
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-32" />
      <Skeleton class="h-20" />
    </div>

    <!-- Modo no configurado -->
    <Alert
      v-else-if="data?.mode === 'unconfigured'"
      variant="warning"
      title="Ayrshare no configurada"
    >
      Falta <code>AYRSHARE_API_KEY</code> en las variables de entorno. Contacta al administrador.
    </Alert>

    <!-- Modo FREE: explicación + acción -->
    <template v-else-if="isFree">
      <Card class="p-6 bg-tane-primary/5 border-tane-primary/30">
        <div class="flex gap-4">
          <div class="text-3xl">🚀</div>
          <div class="flex-1">
            <h3 class="font-display font-semibold mb-2">Modo onboarding asistido</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Estás en la fase inicial de Trendora. Para conectar las redes de tu negocio, el equipo de Tane Solutions las configura por ti en menos de 24 horas. Es gratis y solo se hace una vez por cliente.
            </p>

            <ol class="text-sm space-y-2 mb-5 ml-4 list-decimal">
              <li><strong>Contáctanos</strong> con los datos de tus cuentas (botón abajo).</li>
              <li>Te respondemos en menos de 12h con los pasos para autorizarnos.</li>
              <li>En 15 minutos, todas tus redes quedan conectadas y empiezas a publicar.</li>
            </ol>

            <div class="flex flex-wrap gap-2">
              <Button :disabled="requesting" @click="emailFounder">
                {{ requesting ? 'Registrando…' : '✉️ Solicitar conexión' }}
              </Button>
              <Button variant="outline" as="a" href="https://cal.com/tane/trendora-onboarding" target="_blank" rel="noopener">
                📅 Agendar llamada (15 min)
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- Estado actual de cuentas conectadas (compartidas en modo Free) -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-semibold">Redes activas en este momento</h3>
          <Badge v-if="data?.primaryEmail" variant="secondary" class="text-xs">
            Cuenta principal: {{ data.primaryEmail }}
          </Badge>
        </div>

        <div v-if="data?.accounts.length === 0" class="text-center py-8 text-sm text-muted-foreground">
          <p class="mb-2">No hay ninguna red conectada todavía.</p>
          <p>Trendora generará contenido pero no podrá publicarlo hasta que conectemos al menos una red.</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="account in data?.accounts"
            :key="account.platform"
            class="rounded-lg border p-4 flex items-center gap-3"
          >
            <Avatar
              :src="account.profileImageUrl"
              :fallback="account.handle ?? account.platform"
              size="sm"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">
                {{ PLATFORM_INFO[account.platform]?.label ?? account.platform }}
              </p>
              <p class="text-xs text-muted-foreground truncate">
                {{ account.handle ?? '—' }}
              </p>
            </div>
            <Badge variant="success" class="text-[10px] shrink-0">●</Badge>
          </div>
        </div>

        <div v-if="data?.quota?.limit" class="mt-5 pt-4 border-t text-xs text-muted-foreground">
          Cuota mes actual: {{ data.quota.used }} / {{ data.quota.limit }} posts
        </div>
      </Card>

      <!-- Plataformas disponibles (no conectadas) -->
      <Card class="p-6">
        <h3 class="font-medium mb-3">Otras plataformas que podemos conectar</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Si quieres añadir alguna, indícalo cuando nos contactes.
        </p>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
          <div
            v-for="(info, key) in PLATFORM_INFO"
            :key="key"
            class="rounded-lg border p-3 text-center text-sm"
            :class="connectedSet.has(key) ? 'opacity-50 bg-muted' : ''"
          >
            <div class="text-2xl mb-1">{{ info.icon }}</div>
            <p class="text-xs">{{ info.label }}</p>
            <Badge v-if="connectedSet.has(key)" variant="success" class="mt-1 text-[10px]">
              Activa
            </Badge>
          </div>
        </div>
      </Card>

      <!-- Detalle técnico para devs/admins -->
      <details class="text-xs text-muted-foreground">
        <summary class="cursor-pointer hover:text-foreground">Detalles técnicos del modo onboarding</summary>
        <div class="mt-3 space-y-2 pl-4 border-l-2">
          <p>
            En esta fase Trendora opera en modo <strong>multi-tenant lógico, single-tenant físico</strong>:
            cada org tiene su propio brand kit, contenido, usuarios y métricas, pero las publicaciones
            salen desde una cuenta primaria de Ayrshare gestionada por el equipo de Tane.
          </p>
          <p>
            Cuando lleguemos al hito de 5+ clientes pagando, migraremos a Ayrshare Business plan donde
            cada cliente conectará sus redes mediante un flujo OAuth white-label desde la propia app.
          </p>
          <p class="font-mono">
            Modo: <strong>{{ data?.mode }}</strong> ·
            <Button variant="link" size="sm" class="text-xs h-auto p-0" @click="openAyrshareDashboard">
              Abrir dashboard Ayrshare →
            </Button>
          </p>
        </div>
      </details>
    </template>

    <!-- Modo BUSINESS: flujo OAuth white-label -->
    <template v-else-if="isBusiness">
      <Card class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="font-display font-semibold">Conecta tus cuentas</h3>
            <p class="text-sm text-muted-foreground mt-1">
              Cada red se conecta con un flujo seguro. Solo accedemos para publicar y leer métricas.
            </p>
          </div>
          <Button>+ Conectar nueva cuenta</Button>
        </div>

        <Alert variant="info" title="Flujo de conexión">
          Te llevamos a Ayrshare donde te autenticas con tu red social. Volverás aquí automáticamente.
        </Alert>
      </Card>

      <Card v-if="data?.accounts.length" class="p-2">
        <div class="divide-y">
          <div
            v-for="account in data.accounts"
            :key="account.platform"
            class="p-4 flex items-center gap-4"
          >
            <Avatar
              :src="account.profileImageUrl"
              :fallback="account.handle ?? account.platform"
            />
            <div class="flex-1">
              <p class="font-medium">{{ account.handle ?? account.displayName ?? '—' }}</p>
              <p class="text-xs text-muted-foreground">
                {{ PLATFORM_INFO[account.platform]?.label ?? account.platform }}
              </p>
            </div>
            <Badge variant="success">Conectada</Badge>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
