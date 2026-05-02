<script setup lang="ts">
/**
 * Mockup de preview por plataforma. Muestra cómo se verá el post.
 *
 * Cada plataforma tiene su propio chrome (header, footer, layout).
 * Se ajusta a las restricciones de cada red (longitud, hashtags, etc.).
 */
import { computed } from 'vue'

interface Props {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'threads' | 'pinterest'
  caption: string
  hashtags?: string[]
  imageUrl?: string | null
  handle?: string
  avatarUrl?: string | null
  displayName?: string
}

const props = withDefaults(defineProps<Props>(), {
  hashtags: () => [],
  imageUrl: null,
  handle: '@tu_marca',
  avatarUrl: null,
  displayName: 'Tu marca',
})

const fullText = computed(() => {
  const tags = props.hashtags?.length ? '\n\n' + props.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ') : ''
  return props.caption + tags
})

const truncated = computed(() => {
  // Truncar para preview Instagram (125 chars antes del "ver más")
  if (props.platform === 'instagram' && fullText.value.length > 125) {
    return fullText.value.slice(0, 125)
  }
  if (props.platform === 'twitter' && fullText.value.length > 280) {
    return fullText.value.slice(0, 280)
  }
  return fullText.value
})

const showSeeMore = computed(
  () => props.platform === 'instagram' && fullText.value.length > 125,
)

const aspectRatio = computed(() => {
  if (props.platform === 'tiktok' || props.platform === 'threads') return 'aspect-[9/16]'
  if (props.platform === 'pinterest') return 'aspect-[2/3]'
  return 'aspect-square'
})
</script>

<template>
  <div class="rounded-xl border bg-white text-black shadow-sm overflow-hidden text-sm font-sans max-w-[420px] mx-auto">
    <!-- Header con avatar -->
    <div class="flex items-center gap-3 p-3 border-b">
      <div class="h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 grid place-items-center text-white text-xs font-semibold">
        <img v-if="avatarUrl" :src="avatarUrl" class="h-full w-full rounded-full object-cover" />
        <span v-else>{{ displayName.slice(0, 1).toUpperCase() }}</span>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-[13px]">{{ handle }}</p>
        <p v-if="platform === 'linkedin'" class="text-xs text-gray-500">Empresa · Hace un momento</p>
        <p v-else class="text-xs text-gray-500">Hace un momento</p>
      </div>
      <span class="text-gray-400">⋯</span>
    </div>

    <!-- Imagen -->
    <div :class="['bg-gray-100 grid place-items-center text-gray-400', aspectRatio]">
      <img v-if="imageUrl" :src="imageUrl" class="h-full w-full object-cover" />
      <div v-else class="text-xs flex flex-col items-center gap-2">
        <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-3.5-3.5L9 20" />
        </svg>
        Imagen del post
      </div>
    </div>

    <!-- Acciones -->
    <div class="flex items-center gap-4 p-3 text-gray-600">
      <span>♡</span>
      <span>💬</span>
      <span>↗</span>
      <span class="ml-auto">📑</span>
    </div>

    <!-- Caption -->
    <div class="px-3 pb-3">
      <p v-if="truncated" class="whitespace-pre-wrap leading-relaxed">
        <span class="font-semibold mr-1">{{ handle }}</span>
        {{ truncated }}<span v-if="showSeeMore" class="text-gray-500">… ver más</span>
      </p>
      <p v-if="platform === 'twitter' && fullText.length > 280" class="text-xs text-red-500 mt-1">
        ⚠️ Excede 280 caracteres
      </p>
    </div>
  </div>
</template>
