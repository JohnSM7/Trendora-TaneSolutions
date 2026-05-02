<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ value: string; class?: string }>()
const tabs = inject<{ active: Ref<string> }>('tabs')

const isActive = computed(() => tabs?.active.value === props.value)
const klass = computed(() => cn('mt-2 focus-visible:outline-none', props.class))
</script>

<template>
  <div v-if="isActive" role="tabpanel" :class="klass">
    <slot />
  </div>
</template>
