<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ modelValue?: boolean; disabled?: boolean; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const klass = computed(() =>
  cn(
    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.modelValue ? 'bg-primary' : 'bg-input',
    props.class,
  ),
)

const thumbKlass = computed(() =>
  cn(
    'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
    props.modelValue ? 'translate-x-5' : 'translate-x-0',
  ),
)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="klass"
    @click="toggle"
  >
    <span :class="thumbKlass" />
  </button>
</template>
