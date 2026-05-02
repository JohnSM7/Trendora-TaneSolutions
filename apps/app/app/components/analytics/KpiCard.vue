<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@tane/ui'

const props = defineProps<{
  label: string
  value: number | string
  delta?: number
  format?: 'number' | 'percent' | 'compact'
  hint?: string
}>()

const formatted = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.format === 'percent') return (props.value * 100).toFixed(1) + '%'
  if (props.format === 'compact') {
    return new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(
      props.value,
    )
  }
  return new Intl.NumberFormat('es-ES').format(props.value)
})

const deltaPositive = computed(() => (props.delta ?? 0) >= 0)
</script>

<template>
  <Card class="p-5">
    <p class="text-xs text-muted-foreground uppercase tracking-wide">{{ label }}</p>
    <p class="text-3xl font-display font-bold mt-2">{{ formatted }}</p>
    <div class="flex items-center gap-2 mt-2">
      <span
        v-if="delta !== undefined"
        class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="deltaPositive ? 'bg-tane-accent/10 text-tane-accent-600' : 'bg-destructive/10 text-destructive'"
      >
        {{ deltaPositive ? '↑' : '↓' }} {{ Math.abs(delta * 100).toFixed(0) }}%
      </span>
      <span v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</span>
    </div>
  </Card>
</template>
