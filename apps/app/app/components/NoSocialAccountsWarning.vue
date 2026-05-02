<script setup lang="ts">
/**
 * Aviso visible cuando la org no tiene ninguna red social conectada.
 *
 * Se muestra automáticamente en Studio, Calendar, etc. para evitar que el
 * usuario genere y programe contenido sin saber que no se va a publicar.
 */
import { Alert, Button } from '@tane/ui'

const { hasAccounts, mode, state } = useSocialAccounts()
const { currentOrg } = useCurrentOrg()

const showWarning = computed(() => state.value !== null && !hasAccounts.value)

const settingsUrl = computed(() => `/${currentOrg.value?.slug}/settings/social`)
</script>

<template>
  <Alert
    v-if="showWarning"
    variant="warning"
    title="Aún no hay redes conectadas"
    class="mb-4"
  >
    <div class="space-y-2">
      <p class="text-sm">
        Puedes generar y guardar contenido, pero los posts programados no se publicarán hasta que
        haya al menos una red conectada.
      </p>
      <NuxtLink
        :to="settingsUrl"
        class="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent transition"
      >
        {{ mode === 'free' ? 'Solicitar conexión →' : 'Conectar red →' }}
      </NuxtLink>
    </div>
  </Alert>
</template>
