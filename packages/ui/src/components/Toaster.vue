<script setup lang="ts">
import Toast from './Toast.vue'

interface ToastItem {
  id: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  title?: string
  description?: string
  duration?: number
}

defineProps<{
  toasts: ReadonlyArray<ToastItem>
}>()
defineEmits<{ close: [id: string] }>()
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <Toast
        v-for="t in toasts"
        :key="t.id"
        :variant="t.variant"
        :title="t.title"
        :description="t.description"
        :duration="t.duration ?? 5000"
        @close="$emit('close', t.id)"
      />
    </div>
  </Teleport>
</template>
