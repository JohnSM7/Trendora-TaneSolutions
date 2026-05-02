<script setup lang="ts">
/**
 * Bar chart simple en SVG (sin dependencias).
 * Para algo más sofisticado, swappear por Apexcharts o Tremor cuando lo necesitemos.
 */
import { computed } from 'vue'

interface Props {
  data: Array<{ label: string; value: number }>
  height?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), { height: 200, color: '#5B5BD6' })

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
const barWidth = computed(() => 100 / props.data.length)
</script>

<template>
  <div class="w-full overflow-hidden">
    <svg :height="height + 30" width="100%" preserveAspectRatio="none" :viewBox="`0 0 100 ${height + 30}`">
      <!-- Grid lines -->
      <g stroke="currentColor" stroke-opacity="0.1" stroke-width="0.1">
        <line v-for="i in 4" :key="i" :x1="0" :y1="(i * height) / 4" :x2="100" :y2="(i * height) / 4" />
      </g>

      <!-- Bars -->
      <g v-for="(d, i) in data" :key="i">
        <rect
          :x="i * barWidth + barWidth * 0.15"
          :y="height - (d.value / max) * height"
          :width="barWidth * 0.7"
          :height="(d.value / max) * height"
          :fill="color"
          opacity="0.8"
          rx="0.5"
        >
          <title>{{ d.label }}: {{ d.value }}</title>
        </rect>
      </g>

      <!-- Labels -->
      <g font-size="3" fill="currentColor" text-anchor="middle" opacity="0.6">
        <text v-for="(d, i) in data" :key="i" :x="i * barWidth + barWidth / 2" :y="height + 6">
          {{ d.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
