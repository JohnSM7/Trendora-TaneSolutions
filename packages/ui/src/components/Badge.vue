<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'

const variants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-tane-accent-500/15 text-tane-accent-600',
        warning: 'border-transparent bg-amber-500/15 text-amber-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type Variants = VariantProps<typeof variants>

const props = defineProps<{ variant?: Variants['variant']; class?: string }>()
const klass = computed(() => cn(variants({ variant: props.variant }), props.class))
</script>

<template>
  <span :class="klass">
    <slot />
  </span>
</template>
