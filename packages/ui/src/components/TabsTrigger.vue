<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ value: string; class?: string; disabled?: boolean }>()
const tabs = inject<{ active: Ref<string> }>('tabs')

const isActive = computed(() => tabs?.active.value === props.value)

const klass = computed(() =>
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    isActive.value ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
    props.class,
  ),
)

function activate() {
  if (props.disabled) return
  if (tabs) tabs.active.value = props.value
}
</script>

<template>
  <button
    type="button"
    role="tab"
    :aria-selected="isActive"
    :disabled="disabled"
    :class="klass"
    @click="activate"
  >
    <slot />
  </button>
</template>
