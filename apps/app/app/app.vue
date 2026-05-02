<script setup lang="ts">
import { Toaster } from '@tane/ui'

const toast = useToast()

useHead({
  titleTemplate: (title) => (title ? `${title} · Trendora` : 'Trendora'),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster :toasts="toast.toasts.value" @close="toast.dismiss" />
</template>
