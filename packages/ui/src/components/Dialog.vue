<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{ open: boolean; title?: string; description?: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

function close() {
  emit('update:open', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
        @click.self="close"
      >
        <div
          class="relative bg-card rounded-xl shadow-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Cerrar"
            class="absolute top-3 right-3 rounded-md p-1.5 hover:bg-accent transition"
            @click="close"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div v-if="title || description" class="p-6 pb-2">
            <h2 v-if="title" class="text-lg font-display font-semibold">{{ title }}</h2>
            <p v-if="description" class="text-sm text-muted-foreground mt-1">{{ description }}</p>
          </div>

          <div class="p-6">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex items-center justify-end gap-2 p-6 pt-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
