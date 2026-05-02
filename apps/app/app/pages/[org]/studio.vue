<script setup lang="ts">
import {
  Button,
  Card,
  Input,
  Textarea,
  Label,
  Select,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  Alert,
} from '@tane/ui'
import PlatformPreview from '~/components/studio/PlatformPreview.vue'

definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
const supabase = useDb()
const toast = useToast()

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
  { value: 'pinterest', label: 'Pinterest' },
] as const

type Platform = (typeof PLATFORMS)[number]['value']

interface BrandKit {
  id: string
  name: string
  is_default: boolean
}

interface GeneratedPost {
  platform: Platform
  caption: string
  hashtags?: string[]
  cta?: string
  altText?: string
  imagePrompt?: string
  bestTimeHint?: string
}

// State
const topic = ref('')
const tone = ref<'professional' | 'casual' | 'playful' | 'inspirational' | 'urgent'>('casual')
const length = ref<'short' | 'medium' | 'long'>('medium')
const includeHashtags = ref(true)
const includeCta = ref(true)
const language = ref<'es' | 'en' | 'ca'>('es')
const selectedBrandKit = ref<string>('')
const selectedPlatforms = ref<Platform[]>(['instagram', 'facebook', 'linkedin'])

const generating = ref(false)
const posts = ref<GeneratedPost[]>([])
const reasoning = ref<string>('')
const activeTab = ref<Platform>('instagram')
const error = ref<string | null>(null)
const creditsUsed = ref(0)

// Cargar brand kits
const { data: kits } = await useAsyncData<BrandKit[]>(
  () => `kits-studio-${currentOrg.value?.id}`,
  async () => {
    if (!currentOrg.value?.id) return []
    const { data } = await supabase
      .from('brand_kits')
      .select('id, name, is_default')
      .eq('org_id', currentOrg.value.id)
      .order('is_default', { ascending: false })
    return (data ?? []) as BrandKit[]
  },
  { watch: [currentOrg] },
)

// Por defecto seleccionar el kit por defecto
watchEffect(() => {
  if (!selectedBrandKit.value && kits.value?.length) {
    selectedBrandKit.value = kits.value.find((k) => k.is_default)?.id ?? kits.value[0]!.id
  }
})

const kitOptions = computed(() =>
  (kits.value ?? []).map((k) => ({ value: k.id, label: k.name + (k.is_default ? ' · por defecto' : '') })),
)

function togglePlatform(p: Platform) {
  if (selectedPlatforms.value.includes(p)) {
    selectedPlatforms.value = selectedPlatforms.value.filter((x) => x !== p)
  } else {
    selectedPlatforms.value = [...selectedPlatforms.value, p]
  }
}

const canGenerate = computed(
  () =>
    topic.value.length >= 3 &&
    selectedPlatforms.value.length > 0 &&
    !!selectedBrandKit.value &&
    !generating.value,
)

async function generate() {
  if (!canGenerate.value || !currentOrg.value) return

  generating.value = true
  error.value = null
  posts.value = []

  try {
    const result = await $fetch<{
      posts: GeneratedPost[]
      reasoning?: string
      creditsUsed: number
    }>('/api/ai/generate-post', {
      method: 'POST',
      body: {
        orgSlug: currentOrg.value.slug,
        topic: topic.value,
        platforms: selectedPlatforms.value,
        tone: tone.value,
        length: length.value,
        includeHashtags: includeHashtags.value,
        includeCta: includeCta.value,
        language: language.value,
        brandKitId: selectedBrandKit.value,
      },
    })

    posts.value = result.posts
    reasoning.value = result.reasoning ?? ''
    creditsUsed.value = result.creditsUsed
    activeTab.value = result.posts[0]?.platform ?? 'instagram'
    toast.success(`Generados ${result.posts.length} posts`, `${result.creditsUsed} créditos usados`)
  } catch (e: any) {
    error.value = e?.data?.message ?? e.message ?? 'Error desconocido'
    toast.error('No se pudo generar', error.value || undefined)
  } finally {
    generating.value = false
  }
}

async function saveAsDraft() {
  if (!posts.value.length || !currentOrg.value) return

  // Combina los posts en un draft único con bodies por plataforma
  const bodiesPerPlatform: Record<string, string> = {}
  for (const p of posts.value) {
    const tags = p.hashtags?.length ? '\n\n' + p.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ') : ''
    bodiesPerPlatform[p.platform] = p.caption + tags
  }

  const { error: e } = await supabase.from('content_drafts').insert({
    org_id: currentOrg.value.id,
    brand_kit_id: selectedBrandKit.value,
    title: topic.value.slice(0, 80),
    body: posts.value[0]?.caption ?? '',
    bodies_per_platform: bodiesPerPlatform,
    platforms: selectedPlatforms.value,
    hashtags: posts.value[0]?.hashtags ?? [],
    status: 'draft',
  } as never)

  if (e) {
    toast.error('No se pudo guardar', e.message)
    return
  }
  toast.success('Guardado como borrador', 'Disponible en el calendario')
}
</script>

<template>
  <div class="container max-w-7xl py-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold">Studio IA</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Genera posts adaptados a cada plataforma a partir de un tema.
        </p>
      </div>
    </div>

    <NoSocialAccountsWarning />

    <div class="grid lg:grid-cols-[420px_1fr] gap-6">
      <!-- Panel de generación -->
      <Card class="p-6 space-y-5 h-fit lg:sticky lg:top-4">
        <div>
          <Label for="topic">Tema o mensaje</Label>
          <Textarea
            id="topic"
            v-model="topic"
            :rows="3"
            placeholder="Ej: Anunciar el menú de domingo de Pascua con los nuevos platos de cordero asado."
            class="mt-1.5"
          />
        </div>

        <div>
          <Label>Plataformas</Label>
          <div class="grid grid-cols-2 gap-2 mt-1.5">
            <button
              v-for="p in PLATFORMS"
              :key="p.value"
              type="button"
              class="rounded-md border px-3 py-2 text-sm text-left transition"
              :class="
                selectedPlatforms.includes(p.value)
                  ? 'bg-tane-primary/5 border-tane-primary text-tane-primary'
                  : 'hover:bg-accent'
              "
              @click="togglePlatform(p.value)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label for="tone">Tono</Label>
            <Select
              id="tone"
              v-model="tone"
              :options="[
                { value: 'professional', label: 'Profesional' },
                { value: 'casual', label: 'Cercano' },
                { value: 'playful', label: 'Divertido' },
                { value: 'inspirational', label: 'Inspirador' },
                { value: 'urgent', label: 'Urgente' },
              ]"
              class="mt-1.5"
            />
          </div>
          <div>
            <Label for="length">Longitud</Label>
            <Select
              id="length"
              v-model="length"
              :options="[
                { value: 'short', label: 'Corta' },
                { value: 'medium', label: 'Media' },
                { value: 'long', label: 'Larga' },
              ]"
              class="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label for="brand-kit">Brand kit</Label>
          <Select
            id="brand-kit"
            v-model="selectedBrandKit"
            :options="kitOptions"
            placeholder="Elige un brand kit"
            class="mt-1.5"
          />
        </div>

        <div>
          <Label for="lang">Idioma</Label>
          <Select
            id="lang"
            v-model="language"
            :options="[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'Inglés' },
              { value: 'ca', label: 'Català' },
            ]"
            class="mt-1.5"
          />
        </div>

        <div class="flex items-center justify-between text-sm">
          <span>Incluir hashtags</span>
          <input v-model="includeHashtags" type="checkbox" class="h-4 w-4" />
        </div>
        <div class="flex items-center justify-between text-sm">
          <span>Incluir CTA</span>
          <input v-model="includeCta" type="checkbox" class="h-4 w-4" />
        </div>

        <Button :disabled="!canGenerate" class="w-full" size="lg" @click="generate">
          {{ generating ? 'Generando…' : '✨ Generar posts' }}
        </Button>

        <p v-if="creditsUsed > 0" class="text-xs text-muted-foreground text-center">
          Última generación: {{ creditsUsed }} créditos
        </p>
      </Card>

      <!-- Resultado / Preview -->
      <div>
        <div v-if="generating" class="grid place-items-center h-96">
          <div class="text-center space-y-3">
            <div class="text-5xl animate-pulse">✨</div>
            <p class="text-sm text-muted-foreground">
              La IA está adaptando tu mensaje a {{ selectedPlatforms.length }} plataformas…
            </p>
            <Skeleton class="h-2 w-48 mx-auto" />
          </div>
        </div>

        <div v-else-if="error" class="space-y-3">
          <Alert variant="destructive" title="Error al generar">
            {{ error }}
          </Alert>
        </div>

        <div v-else-if="posts.length === 0" class="grid place-items-center h-96 rounded-xl border border-dashed bg-card">
          <div class="text-center max-w-md p-8">
            <div class="text-4xl mb-4">💡</div>
            <h2 class="font-display font-semibold text-lg mb-2">
              Empieza describiendo qué quieres comunicar
            </h2>
            <p class="text-sm text-muted-foreground">
              La IA elegirá longitud, formato y hashtags óptimos por plataforma según tu brand kit.
            </p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <Tabs v-model="activeTab">
            <TabsList class="w-full">
              <TabsTrigger v-for="p in posts" :key="p.platform" :value="p.platform" class="flex-1">
                {{ PLATFORMS.find((pp) => pp.value === p.platform)?.label }}
              </TabsTrigger>
            </TabsList>

            <TabsContent v-for="p in posts" :key="p.platform" :value="p.platform">
              <div class="grid lg:grid-cols-2 gap-6 mt-4">
                <PlatformPreview
                  :platform="p.platform"
                  :caption="p.caption"
                  :hashtags="p.hashtags"
                />

                <Card class="p-5 space-y-4">
                  <div>
                    <Label class="text-xs uppercase tracking-wide text-muted-foreground">Texto</Label>
                    <Textarea v-model="p.caption" :rows="6" class="mt-1.5" />
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ p.caption.length }} caracteres
                    </p>
                  </div>

                  <div v-if="p.hashtags?.length">
                    <Label class="text-xs uppercase tracking-wide text-muted-foreground">Hashtags</Label>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge v-for="tag in p.hashtags" :key="tag" variant="secondary">
                        #{{ tag.replace(/^#/, '') }}
                      </Badge>
                    </div>
                  </div>

                  <div v-if="p.cta">
                    <Label class="text-xs uppercase tracking-wide text-muted-foreground">CTA sugerido</Label>
                    <p class="text-sm mt-1">{{ p.cta }}</p>
                  </div>

                  <div v-if="p.imagePrompt">
                    <Label class="text-xs uppercase tracking-wide text-muted-foreground">Prompt de imagen</Label>
                    <p class="text-sm mt-1 text-muted-foreground italic">{{ p.imagePrompt }}</p>
                    <Button variant="outline" size="sm" class="mt-2">
                      🪄 Generar imagen
                    </Button>
                  </div>

                  <div v-if="p.bestTimeHint" class="rounded-md bg-tane-primary/5 px-3 py-2 text-xs">
                    🕒 Mejor hora: {{ p.bestTimeHint }}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div v-if="reasoning" class="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
            <p class="font-medium mb-1">Por qué la IA tomó estas decisiones</p>
            <p>{{ reasoning }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="generate">🔄 Regenerar</Button>
            <Button @click="saveAsDraft">Guardar como borrador →</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
