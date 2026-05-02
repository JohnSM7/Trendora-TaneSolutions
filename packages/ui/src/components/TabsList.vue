<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ class?: string }>()
const klass = computed(() =>
  cn(
    'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
    props.class,
  ),
)
</script>

<template>
  <div role="tablist" :class="klass">
    <slot />
  </div>
</template>
