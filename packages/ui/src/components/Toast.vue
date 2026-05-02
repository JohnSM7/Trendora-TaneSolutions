<script setup lang="ts">
/**
 * Toast individual. Usar el composable useToast() (en apps) para gestionarlos.
 */
import { computed, onMounted } from 'vue'
import { cn } from '../utils'

const props = defineProps<{
  variant?: 'default' | 'success' | 'error' | 'warning'
  title?: string
  description?: string
  duration?: number
}>()

const emit = defineEmits<{ close: [] }>()

const klass = computed(() =>
  cn(
    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
    {
      default: 'bg-card text-foreground',
      success: 'bg-tane-accent-500/10 border-tane-accent-500/30 text-foreground',
      error: 'bg-destructive/10 border-destructive/30 text-destructive',
      warning: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
    }[props.variant ?? 'default'],
  ),
)

onMounted(() => {
  if (props.duration && props.duration > 0) {
    setTimeout(() => emit('close'), props.duration)
  }
})
</script>

<template>
  <div :class="klass" role="status" aria-live="polite">
    <div class="flex-1">
      <p v-if="title" class="text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-sm text-muted-foreground mt-0.5">{{ description }}</p>
    </div>
    <button
      class="text-muted-foreground hover:text-foreground transition"
      aria-label="Cerrar"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>
