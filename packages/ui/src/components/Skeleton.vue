<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ class?: string }>()
const klass = computed(() => cn('animate-pulse rounded-md bg-muted', props.class))
</script>

<template>
  <div :class="klass" />
</template>
