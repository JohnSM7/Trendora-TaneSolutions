<script setup lang="ts">
import { Button, Input, Textarea, Label, Card, Badge, Switch, Separator, Alert } from '@tane/ui'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { currentOrg } = useCurrentOrg()
const supabase = useDb()
const toast = useToast()

const isNew = computed(() => route.params.id === 'new')
const id = computed(() => (isNew.value ? null : (route.params.id as string)))

const form = reactive({
  name: '',
  is_default: false,
  voice_prompt: '',
  primary_color: '#5B5BD6',
  accent_color: '#00D4A4',
  default_cta: '',
  tone: [] as string[],
  do_say: [] as string[],
  do_not_say: [] as string[],
  hashtag_sets: [] as Array<{ name: string; tags: string[] }>,
})

const newDoSay = ref('')
const newDoNotSay = ref('')
const newToneTag = ref('')

const saving = ref(false)
const loading = ref(!isNew.value)

const TONE_SUGGESTIONS = [
  'cercano',
  'profesional',
  'autentico',
  'experto',
  'inspirador',
  'divertido',
  'directo',
  'cuidado',
  'familiar',
]

onMounted(async () => {
  if (isNew.value || !id.value) return
  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', id.value)
    .single()

  if (error || !data) {
    toast.error('No se pudo cargar el brand kit')
    return router.push(`/${currentOrg.value?.slug}/brand-kits`)
  }

  form.name = data.name
  form.is_default = data.is_default
  form.voice_prompt = data.voice_prompt ?? ''
  form.primary_color = data.primary_color ?? '#5B5BD6'
  form.accent_color = data.accent_color ?? '#00D4A4'
  form.default_cta = data.default_cta ?? ''
  form.tone = data.tone ?? []
  form.do_say = data.do_say ?? []
  form.do_not_say = data.do_not_say ?? []
  form.hashtag_sets = (data.hashtag_sets as any) ?? []
  loading.value = false
})

function addTo(field: 'do_say' | 'do_not_say', valueRef: { value: string }) {
  const v = valueRef.value.trim()
  if (!v) return
  form[field] = [...form[field], v]
  valueRef.value = ''
}

function removeFrom(field: 'do_say' | 'do_not_say' | 'tone', i: number) {
  form[field] = form[field].filter((_, idx) => idx !== i)
}

function toggleTone(tag: string) {
  if (form.tone.includes(tag)) {
    form.tone = form.tone.filter((t) => t !== tag)
  } else {
    form.tone = [...form.tone, tag]
  }
}

async function save() {
  if (!form.name || !currentOrg.value?.id) {
    toast.error('Falta el nombre del brand kit')
    return
  }
  saving.value = true

  const payload = {
    org_id: currentOrg.value.id,
    name: form.name,
    is_default: form.is_default,
    voice_prompt: form.voice_prompt || null,
    primary_color: form.primary_color,
    accent_color: form.accent_color,
    default_cta: form.default_cta || null,
    tone: form.tone,
    do_say: form.do_say,
    do_not_say: form.do_not_say,
    hashtag_sets: form.hashtag_sets,
  }

  const { data, error } = isNew.value
    ? await supabase.from('brand_kits').insert(payload).select('id').single()
    : await supabase.from('brand_kits').update(payload).eq('id', id.value!).select('id').single()

  saving.value = false

  if (error) {
    toast.error('Error al guardar', error.message)
    return
  }

  toast.success(isNew.value ? 'Brand kit creado' : 'Cambios guardados')
  if (isNew.value && data) {
    router.replace(`/${currentOrg.value.slug}/brand-kits/${data.id}`)
  }
}

async function remove() {
  if (!id.value || !confirm('¿Borrar este brand kit? Esta acción no se puede deshacer.')) return
  const { error } = await supabase.from('brand_kits').delete().eq('id', id.value)
  if (error) {
    toast.error('Error al borrar', error.message)
    return
  }
  toast.success('Brand kit eliminado')
  router.push(`/${currentOrg.value?.slug}/brand-kits`)
}
</script>

<template>
  <div class="container max-w-3xl py-8">
    <div class="mb-6">
      <NuxtLink
        :to="`/${currentOrg?.slug}/brand-kits`"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Brand Kits
      </NuxtLink>
      <h1 class="text-2xl font-display font-bold mt-2">
        {{ isNew ? 'Nuevo brand kit' : form.name || 'Editar brand kit' }}
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        Cuanto más detallado, mejor entenderá la IA tu marca.
      </p>
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground">Cargando…</div>

    <div v-else class="space-y-6">
      <!-- Identidad -->
      <Card class="p-6 space-y-4">
        <h2 class="font-display font-semibold">Identidad</h2>

        <div>
          <Label for="name">Nombre interno</Label>
          <Input id="name" v-model="form.name" placeholder="Marca principal" class="mt-1.5" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <Label>Brand kit por defecto</Label>
            <p class="text-xs text-muted-foreground">
              Se usará automáticamente al generar contenido si no eliges otro.
            </p>
          </div>
          <Switch v-model="form.is_default" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="primary">Color primario</Label>
            <div class="flex items-center gap-2 mt-1.5">
              <input
                id="primary"
                v-model="form.primary_color"
                type="color"
                class="h-10 w-12 rounded border cursor-pointer"
              />
              <Input v-model="form.primary_color" class="flex-1" />
            </div>
          </div>
          <div>
            <Label for="accent">Color secundario</Label>
            <div class="flex items-center gap-2 mt-1.5">
              <input
                id="accent"
                v-model="form.accent_color"
                type="color"
                class="h-10 w-12 rounded border cursor-pointer"
              />
              <Input v-model="form.accent_color" class="flex-1" />
            </div>
          </div>
        </div>
      </Card>

      <!-- Voz y tono -->
      <Card class="p-6 space-y-4">
        <h2 class="font-display font-semibold">Voz y tono</h2>

        <div>
          <Label for="voice">Descripción de la voz</Label>
          <p class="text-xs text-muted-foreground mb-1.5">
            Cuenta a la IA cómo sois, qué transmitís y a quién os dirigís. Como si presentaras tu negocio a un copywriter profesional.
          </p>
          <Textarea
            id="voice"
            v-model="form.voice_prompt"
            :rows="6"
            placeholder="Somos una pizzería italiana familiar en Madrid. Tono cercano y auténtico, con guiños a la cultura italiana sin caricaturizarla. Resaltamos productos frescos, masa madre y horno de leña…"
          />
        </div>

        <div>
          <Label>Adjetivos del tono</Label>
          <div class="flex flex-wrap gap-2 mt-1.5">
            <button
              v-for="tag in TONE_SUGGESTIONS"
              :key="tag"
              type="button"
              class="rounded-full border px-3 py-1 text-xs transition"
              :class="form.tone.includes(tag) ? 'bg-tane-primary text-white border-tane-primary' : 'hover:bg-accent'"
              @click="toggleTone(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <div>
          <Label for="cta">CTA por defecto</Label>
          <Input
            id="cta"
            v-model="form.default_cta"
            placeholder="Reserva tu mesa en lastrada.com"
            class="mt-1.5"
          />
        </div>
      </Card>

      <!-- Frases preferidas -->
      <Card class="p-6 space-y-4">
        <h2 class="font-display font-semibold">Frases y palabras</h2>

        <div>
          <Label>Decimos sí a (frases preferidas)</Label>
          <div class="flex gap-2 mt-1.5">
            <Input
              v-model="newDoSay"
              placeholder="masa madre, productos frescos…"
              @keydown.enter.prevent="addTo('do_say', newDoSay as any)"
            />
            <Button type="button" variant="outline" @click="addTo('do_say', newDoSay as any)">+</Button>
          </div>
          <div v-if="form.do_say.length" class="flex flex-wrap gap-2 mt-2">
            <Badge v-for="(s, i) in form.do_say" :key="i" variant="success" class="gap-1">
              {{ s }}
              <button class="ml-1 hover:text-destructive" @click="removeFrom('do_say', i)">×</button>
            </Badge>
          </div>
        </div>

        <Separator />

        <div>
          <Label>Decimos no a (palabras prohibidas)</Label>
          <div class="flex gap-2 mt-1.5">
            <Input
              v-model="newDoNotSay"
              placeholder="barato, fast food…"
              @keydown.enter.prevent="addTo('do_not_say', newDoNotSay as any)"
            />
            <Button type="button" variant="outline" @click="addTo('do_not_say', newDoNotSay as any)">+</Button>
          </div>
          <div v-if="form.do_not_say.length" class="flex flex-wrap gap-2 mt-2">
            <Badge v-for="(s, i) in form.do_not_say" :key="i" variant="destructive" class="gap-1">
              {{ s }}
              <button class="ml-1 hover:text-white/80" @click="removeFrom('do_not_say', i)">×</button>
            </Badge>
          </div>
        </div>
      </Card>

      <Alert variant="info" title="¿Por qué importa?">
        Estos campos forman el system prompt que la IA usa en cada generación. Cuanto más concretos seas (sobre todo en "decimos no a"), más fiel será la voz.
      </Alert>

      <div class="flex items-center justify-between">
        <Button v-if="!isNew" variant="ghost" class="text-destructive" @click="remove">
          Borrar brand kit
        </Button>
        <div class="flex gap-2 ml-auto">
          <NuxtLink :to="`/${currentOrg?.slug}/brand-kits`">
            <Button variant="outline">Cancelar</Button>
          </NuxtLink>
          <Button :disabled="saving || !form.name" @click="save">
            {{ saving ? 'Guardando…' : isNew ? 'Crear brand kit' : 'Guardar cambios' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
