<script setup lang="ts">
/**
 * ThemeToggle — botón compacto que rota entre light → dark → system.
 */
import { computed } from 'vue'

const { theme, setTheme } = useTheme()

const next = computed<'light' | 'dark' | 'system'>(() => {
  if (theme.value === 'light') return 'dark'
  if (theme.value === 'dark') return 'system'
  return 'light'
})

const label = computed(() => {
  if (theme.value === 'light') return 'Claro'
  if (theme.value === 'dark') return 'Oscuro'
  return 'Sistema'
})

function rotate() {
  setTheme(next.value)
}
</script>

<template>
  <button
    type="button"
    :title="`Tema: ${label} (clic para cambiar)`"
    :aria-label="`Tema actual ${label}, cambiar a ${next}`"
    class="inline-flex items-center justify-center rounded-md border bg-background h-9 w-9 hover:bg-accent transition"
    @click="rotate"
  >
    <!-- Sol -->
    <svg
      v-if="theme === 'light'"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <!-- Luna -->
    <svg
      v-else-if="theme === 'dark'"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
    <!-- Monitor (system) -->
    <svg
      v-else
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  </button>
</template>
