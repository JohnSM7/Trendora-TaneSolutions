<script setup lang="ts">
/**
 * Layout de Settings con sidebar de subsecciones.
 */
import { Card } from '@tane/ui'

definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()

const sections = computed(() => {
  if (!currentOrg.value) return []
  const base = `/${currentOrg.value.slug}/settings`
  return [
    { label: 'General', href: base },
    { label: 'Redes sociales', href: `${base}/social` },
    { label: 'Equipo', href: `${base}/team` },
    { label: 'Facturación', href: `${base}/billing` },
    { label: 'Notificaciones', href: `${base}/notifications` },
  ]
})
</script>

<template>
  <div class="container max-w-6xl py-6">
    <h1 class="text-2xl font-display font-bold mb-6">Ajustes</h1>

    <div class="grid lg:grid-cols-[220px_1fr] gap-6">
      <Card class="p-2 h-fit">
        <nav class="space-y-1">
          <NuxtLink
            v-for="s in sections"
            :key="s.href"
            :to="s.href"
            class="block px-3 py-2 rounded-md text-sm hover:bg-accent transition"
            active-class="bg-tane-primary/10 text-tane-primary"
            exact-active-class="bg-tane-primary/10 text-tane-primary"
          >
            {{ s.label }}
          </NuxtLink>
        </nav>
      </Card>

      <div>
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
