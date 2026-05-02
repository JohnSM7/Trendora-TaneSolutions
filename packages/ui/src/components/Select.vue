<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '../utils'

interface Option {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  class?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

const klass = computed(() =>
  cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <select
    v-bind="attrs"
    :value="modelValue"
    :class="klass"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
