<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ class?: string }>()
const klass = computed(() =>
  cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class),
)
</script>

<template>
  <div :class="klass">
    <slot />
  </div>
</template>
