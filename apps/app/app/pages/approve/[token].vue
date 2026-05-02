<script setup lang="ts">
/**
 * Página PÚBLICA de aprobación.
 *
 * El cliente final recibe un link con un token único que le permite ver
 * el post propuesto y aprobarlo o pedir cambios SIN tener cuenta en Tane.
 *
 * Sin layout principal (solo branded card).
 */
import { Button, Card, Badge, Textarea, Alert, Tabs, TabsList, TabsTrigger, TabsContent } from '@tane/ui'
import PlatformPreview from '~/components/studio/PlatformPreview.vue'

definePageMeta({ layout: false, middleware: [] })

const route = useRoute()
const token = computed(() => route.params.token as string)

interface ApprovalView {
  draft: {
    id: string
    title: string | null
    body: string
    bodies_per_platform: Record<string, string>
    platforms: string[]
    hashtags: string[] | null
    media: any[]
    scheduled_at: string | null
  }
  org: { name: string; primary_color: string | null }
  status: 'pending' | 'approved' | 'rejected'
  expires_at: string
}

const data = ref<ApprovalView | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref<'approved' | 'rejected' | null>(null)
const comment = ref('')
const activeTab = ref('')

onMounted(async () => {
  try {
    data.value = await $fetch<ApprovalView>(`/api/approval/${token.value}`)
    activeTab.value = data.value.draft.platforms[0] ?? ''
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Enlace inválido o expirado'
  } finally {
    loading.value = false
  }
})

async function submit(decision: 'approved' | 'rejected') {
  submitting.value = true
  try {
    await $fetch(`/api/approval/${token.value}`, {
      method: 'POST',
      body: { decision, comment: comment.value },
    })
    success.value = decision
  } catch (e: any) {
    error.value = e?.data?.message ?? 'No se pudo enviar la respuesta'
  } finally {
    submitting.value = false
  }
}

function getBody(platform: string) {
  if (!data.value) return ''
  return data.value.draft.bodies_per_platform[platform] || data.value.draft.body
}
</script>

<template>
  <div class="min-h-screen bg-tane-paper py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Header marca -->
      <div class="text-center mb-8">
        <p class="text-xs uppercase tracking-wide text-muted-foreground mb-1">Aprobación de contenido</p>
        <h1 v-if="data" class="text-2xl font-display font-bold">{{ data.org.name }}</h1>
      </div>

      <div v-if="loading" class="text-center text-muted-foreground py-12">Cargando…</div>

      <Alert v-else-if="error" variant="destructive" title="No se puede mostrar este post">
        {{ error }}
      </Alert>

      <div v-else-if="success" class="rounded-xl border bg-card p-10 text-center space-y-4">
        <div class="text-5xl">{{ success === 'approved' ? '✅' : '✋' }}</div>
        <h2 class="text-xl font-display font-bold">
          {{ success === 'approved' ? '¡Aprobado!' : 'Cambios solicitados' }}
        </h2>
        <p class="text-muted-foreground text-sm max-w-md mx-auto">
          {{
            success === 'approved'
              ? 'El equipo programará la publicación en breve. Puedes cerrar esta pestaña.'
              : 'El equipo revisará tus comentarios y volverá con una nueva propuesta.'
          }}
        </p>
      </div>

      <Card v-else-if="data" class="p-6 md:p-8">
        <div class="flex items-center gap-2 mb-4">
          <Badge v-if="data.draft.scheduled_at" variant="secondary">
            Para
            {{ new Date(data.draft.scheduled_at).toLocaleString('es-ES', {
              dateStyle: 'long',
              timeStyle: 'short',
            }) }}
          </Badge>
          <Badge v-for="p in data.draft.platforms" :key="p" variant="outline">{{ p }}</Badge>
        </div>

        <Tabs v-model="activeTab">
          <TabsList class="w-full">
            <TabsTrigger v-for="p in data.draft.platforms" :key="p" :value="p" class="flex-1">
              {{ p }}
            </TabsTrigger>
          </TabsList>
          <TabsContent v-for="p in data.draft.platforms" :key="p" :value="p">
            <div class="grid lg:grid-cols-2 gap-6 mt-4">
              <PlatformPreview :platform="p as any" :caption="getBody(p)" :hashtags="data.draft.hashtags ?? []" />
              <div class="space-y-3">
                <p class="text-xs text-muted-foreground uppercase tracking-wide">Texto completo</p>
                <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ getBody(p) }}</p>
                <div v-if="data.draft.hashtags?.length">
                  <p class="text-xs text-muted-foreground uppercase tracking-wide mt-4">Hashtags</p>
                  <div class="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge v-for="tag in data.draft.hashtags" :key="tag" variant="secondary">
                      #{{ tag.replace(/^#/, '') }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div class="border-t mt-8 pt-6 space-y-4">
          <div>
            <label class="text-sm font-medium block mb-1.5">Comentarios (opcional)</label>
            <Textarea
              v-model="comment"
              :rows="3"
              placeholder="¿Algún cambio? Cuéntanoslo aquí."
            />
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              :disabled="submitting"
              class="flex-1"
              @click="submit('rejected')"
            >
              ✋ Pedir cambios
            </Button>
            <Button :disabled="submitting" class="flex-1" @click="submit('approved')">
              ✅ {{ submitting ? 'Enviando…' : 'Aprobar y programar' }}
            </Button>
          </div>
        </div>

        <p class="text-xs text-center text-muted-foreground mt-6">
          Enlace válido hasta {{ new Date(data.expires_at).toLocaleDateString('es-ES') }}
        </p>
      </Card>

      <p class="text-center text-xs text-muted-foreground mt-8">
        Powered by <a href="https://tanesolutions.com" class="hover:text-foreground">Trendora</a>
      </p>
    </div>
  </div>
</template>
