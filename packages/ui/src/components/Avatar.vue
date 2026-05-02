<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
}>()

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }

const klass = computed(() =>
  cn(
    'relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted text-muted-foreground items-center justify-center font-medium',
    sizes[props.size ?? 'md'],
    props.class,
  ),
)

const initials = computed(() => {
  const text = props.fallback ?? props.alt ?? '?'
  return text
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <span :class="klass">
    <img v-if="src" :src="src" :alt="alt ?? ''" class="h-full w-full object-cover" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
