<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'

const variants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground',
        info: 'bg-tane-primary/5 border-tane-primary/30 text-foreground',
        success: 'bg-tane-accent-500/10 border-tane-accent-500/30',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
        destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type Variants = VariantProps<typeof variants>

const props = defineProps<{
  variant?: Variants['variant']
  title?: string
  class?: string
}>()
const klass = computed(() => cn(variants({ variant: props.variant }), props.class))
</script>

<template>
  <div role="alert" :class="klass">
    <p v-if="title" class="font-medium mb-1">{{ title }}</p>
    <div class="text-sm">
      <slot />
    </div>
  </div>
</template>
