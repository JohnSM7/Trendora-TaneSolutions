<script setup lang="ts">
import { Button, Card, Badge, Skeleton } from '@tane/ui'

definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
const supabase = useDb()

interface BrandKitRow {
  id: string
  name: string
  is_default: boolean
  primary_color: string | null
  accent_color: string | null
  voice_prompt: string | null
  updated_at: string
}

const { data: kits, pending } = await useAsyncData<BrandKitRow[]>(
  () => `kits-${currentOrg.value?.id}`,
  async () => {
    if (!currentOrg.value?.id) return []
    const { data } = await supabase
      .from('brand_kits')
      .select('id, name, is_default, primary_color, accent_color, voice_prompt, updated_at')
      .eq('org_id', currentOrg.value.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
    return (data ?? []) as BrandKitRow[]
  },
  { watch: [currentOrg] },
)
</script>

<template>
  <div class="container max-w-6xl py-8">
    <div class="flex items-end justify-between mb-8">
      <div>
        <h1 class="text-2xl font-display font-bold">Brand Kits</h1>
        <p class="text-sm text-muted-foreground mt-1">
          La identidad de marca que la IA usará en cada generación.
        </p>
      </div>
      <NuxtLink :to="`/${currentOrg?.slug}/brand-kits/new`">
        <Button>+ Nuevo brand kit</Button>
      </NuxtLink>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 3" :key="i" class="h-40" />
    </div>

    <div v-else-if="!kits || kits.length === 0" class="rounded-xl border bg-card p-10 text-center">
      <p class="text-muted-foreground mb-4">Aún no tienes brand kits.</p>
      <NuxtLink :to="`/${currentOrg?.slug}/brand-kits/new`">
        <Button>Crear el primero</Button>
      </NuxtLink>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="kit in kits"
        :key="kit.id"
        :to="`/${currentOrg?.slug}/brand-kits/${kit.id}`"
      >
        <Card class="p-5 hover:border-tane-primary transition cursor-pointer h-full">
          <div class="flex items-start justify-between mb-3">
            <h2 class="font-medium">{{ kit.name }}</h2>
            <Badge v-if="kit.is_default" variant="success">Por defecto</Badge>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span
              class="block h-6 w-6 rounded border"
              :style="{ backgroundColor: kit.primary_color ?? '#5B5BD6' }"
            />
            <span
              class="block h-6 w-6 rounded border"
              :style="{ backgroundColor: kit.accent_color ?? '#00D4A4' }"
            />
          </div>
          <p class="text-xs text-muted-foreground line-clamp-3">
            {{ kit.voice_prompt ?? 'Sin voz definida.' }}
          </p>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
