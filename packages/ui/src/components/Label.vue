<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../utils'

/**
 * Label de formulario.
 *
 * Uso normal: <Label for="email">Email</Label>
 * El atributo `for` se hereda automáticamente como atributo HTML
 * (no como prop, porque `for` es palabra reservada en JS).
 */
defineOptions({ inheritAttrs: true })

const props = defineProps<{ class?: string }>()
const klass = computed(() =>
  cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    props.class,
  ),
)
</script>

<template>
  <label :class="klass">
    <slot />
  </label>
</template>
