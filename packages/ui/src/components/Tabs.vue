<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { cn } from '../utils'

const props = defineProps<{ modelValue?: string; defaultValue?: string; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const internalValue = ref(props.modelValue ?? props.defaultValue ?? '')
const active = computed({
  get: () => props.modelValue ?? internalValue.value,
  set: (v) => {
    internalValue.value = v
    emit('update:modelValue', v)
  },
})

provide('tabs', { active })
</script>

<template>
  <div :class="cn('w-full', $props.class)">
    <slot />
  </div>
</template>
