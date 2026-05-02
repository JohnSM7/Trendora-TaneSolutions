<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{
  orientation?: 'horizontal' | 'vertical'
  class?: string
}>()

const klass = computed(() =>
  cn(
    'shrink-0 bg-border',
    (props.orientation ?? 'horizontal') === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
    props.class,
  ),
)
</script>

<template>
  <div role="separator" :class="klass" />
</template>
