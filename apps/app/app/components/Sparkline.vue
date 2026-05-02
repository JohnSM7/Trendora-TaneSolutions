<script setup lang="ts">
/**
 * Mini gráfico de línea SVG inline (sin dependencias externas).
 * Útil para sparklines en KPI cards.
 */
interface Props {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 100,
  height: 32,
  stroke: 'currentColor',
  fill: 'none',
  strokeWidth: 1.5,
})

const path = computed(() => {
  if (!props.values.length) return ''
  const max = Math.max(1, ...props.values)
  const min = Math.min(0, ...props.values)
  const range = max - min || 1
  const stepX = props.width / Math.max(1, props.values.length - 1)
  return props.values
    .map((v, i) => {
      const x = i * stepX
      const y = props.height - ((v - min) / range) * props.height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const areaPath = computed(() => {
  if (!props.fill || props.fill === 'none' || !props.values.length) return ''
  const max = Math.max(1, ...props.values)
  const min = Math.min(0, ...props.values)
  const range = max - min || 1
  const stepX = props.width / Math.max(1, props.values.length - 1)
  const points = props.values.map((v, i) => {
    const x = i * stepX
    const y = props.height - ((v - min) / range) * props.height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M 0,${props.height} L ${points.join(' L ')} L ${props.width},${props.height} Z`
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    :width="width"
    :height="height"
    preserveAspectRatio="none"
    class="overflow-visible"
  >
    <path v-if="areaPath" :d="areaPath" :fill="fill" opacity="0.15" />
    <path :d="path" :stroke="stroke" :stroke-width="strokeWidth" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
