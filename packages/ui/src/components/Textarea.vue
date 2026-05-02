<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '../utils'

const props = defineProps<{
  modelValue?: string
  class?: string
  rows?: number
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

const klass = computed(() =>
  cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'resize-y',
    props.class,
  ),
)
</script>

<template>
  <textarea
    v-bind="attrs"
    :value="modelValue"
    :rows="rows ?? 4"
    :class="klass"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
