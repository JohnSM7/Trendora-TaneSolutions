<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Array<{ label: string; value: number }>
  height?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), { height: 200, color: '#5B5BD6' })

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
const min = computed(() => Math.min(0, ...props.data.map((d) => d.value)))

const points = computed(() => {
  const range = max.value - min.value || 1
  return props.data
    .map((d, i) => {
      const x = (i / Math.max(1, props.data.length - 1)) * 100
      const y = props.height - ((d.value - min.value) / range) * props.height
      return `${x},${y}`
    })
    .join(' ')
})

const areaPoints = computed(() => `0,${props.height} ${points.value} 100,${props.height}`)
</script>

<template>
  <div class="w-full overflow-hidden">
    <svg :height="height + 30" width="100%" preserveAspectRatio="none" :viewBox="`0 0 100 ${height + 30}`">
      <g stroke="currentColor" stroke-opacity="0.1" stroke-width="0.1">
        <line v-for="i in 4" :key="i" :x1="0" :y1="(i * height) / 4" :x2="100" :y2="(i * height) / 4" />
      </g>

      <polygon :points="areaPoints" :fill="color" opacity="0.1" />
      <polyline :points="points" :stroke="color" stroke-width="0.5" fill="none" stroke-linejoin="round" />
      <g v-for="(d, i) in data" :key="i">
        <circle
          :cx="(i / Math.max(1, data.length - 1)) * 100"
          :cy="height - ((d.value - min) / (max - min || 1)) * height"
          r="0.6"
          :fill="color"
        >
          <title>{{ d.label }}: {{ d.value }}</title>
        </circle>
      </g>

      <g font-size="3" fill="currentColor" text-anchor="middle" opacity="0.6">
        <text
          v-for="(d, i) in data"
          :key="i"
          :x="(i / Math.max(1, data.length - 1)) * 100"
          :y="height + 6"
        >
          {{ d.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
