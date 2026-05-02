<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { currentOrg } = useCurrentOrg()
</script>

<template>
  <div class="container max-w-6xl py-8">
    <h1 class="text-2xl font-display font-bold mb-2">
      {{ currentOrg?.name ?? 'Organización' }}
    </h1>
    <p class="text-sm text-tane-muted mb-8">Resumen de tu actividad social esta semana.</p>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border bg-card p-6">
        <p class="text-sm text-tane-muted">Posts publicados</p>
        <p class="text-3xl font-display font-bold mt-2">—</p>
        <p class="text-xs text-tane-muted mt-1">últimos 7 días</p>
      </div>
      <div class="rounded-xl border bg-card p-6">
        <p class="text-sm text-tane-muted">Posts programados</p>
        <p class="text-3xl font-display font-bold mt-2">—</p>
        <p class="text-xs text-tane-muted mt-1">próximos 7 días</p>
      </div>
      <div class="rounded-xl border bg-card p-6">
        <p class="text-sm text-tane-muted">Créditos IA</p>
        <p class="text-3xl font-display font-bold mt-2">—</p>
        <p class="text-xs text-tane-muted mt-1">restantes este ciclo</p>
      </div>
    </div>

    <div class="mt-8 grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-medium mb-1">Conecta tus redes</h3>
        <p class="text-sm text-tane-muted mb-4">
          Conecta Instagram, Facebook, LinkedIn y más en un solo paso.
        </p>
        <NuxtLink
          :to="`/${currentOrg?.slug}/settings/social`"
          class="inline-flex items-center justify-center rounded-md bg-tane-primary px-4 py-2 text-sm font-medium text-white hover:bg-tane-primary/90 transition"
        >
          Conectar redes
        </NuxtLink>
      </div>

      <div class="rounded-xl border bg-card p-6">
        <h3 class="font-medium mb-1">Genera tu primer post con IA</h3>
        <p class="text-sm text-tane-muted mb-4">
          Define tu marca y deja que la IA cree contenido en tu voz.
        </p>
        <NuxtLink
          :to="`/${currentOrg?.slug}/studio`"
          class="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-accent transition"
        >
          Abrir Studio
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
