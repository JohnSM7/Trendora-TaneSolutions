<script setup lang="ts">
/**
 * Gráfico de área dual con eje X temporal — SVG inline sin libs.
 * Muestra dos series superpuestas (típicamente "publicado" + "programado").
 */
interface Point {
  date: string
  published: number
  scheduled: number
}

interface Props {
  data: Point[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), { height: 220 })

const VIEWBOX_W = 800
const VIEWBOX_H = computed(() => props.height)
const PADDING = { top: 10, right: 12, bottom: 28, left: 32 }

const max = computed(() => {
  const m = Math.max(
    ...props.data.flatMap((d) => [d.published, d.scheduled]),
    1,
  )
  return Math.ceil(m * 1.2)
})

const innerW = computed(() => VIEWBOX_W - PADDING.left - PADDING.right)
const innerH = computed(() => VIEWBOX_H.value - PADDING.top - PADDING.bottom)

function pointFor(i: number, value: number) {
  const stepX = innerW.value / Math.max(1, props.data.length - 1)
  const x = PADDING.left + i * stepX
  const y = PADDING.top + innerH.value - (value / max.value) * innerH.value
  return { x, y }
}

const publishedPath = computed(() => {
  if (!props.data.length) return ''
  return props.data
    .map((d, i) => {
      const p = pointFor(i, d.published)
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })
    .join(' ')
})

const publishedArea = computed(() => {
  if (!props.data.length) return ''
  const points = props.data.map((d, i) => {
    const p = pointFor(i, d.published)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  })
  const baseline = PADDING.top + innerH.value
  const x0 = pointFor(0, 0).x
  const xN = pointFor(props.data.length - 1, 0).x
  return `M ${x0},${baseline} L ${points.join(' L ')} L ${xN},${baseline} Z`
})

const scheduledPath = computed(() => {
  if (!props.data.length) return ''
  return props.data
    .map((d, i) => {
      const p = pointFor(i, d.scheduled)
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })
    .join(' ')
})

const xLabels = computed(() => {
  // Mostramos ~6 ticks
  const step = Math.max(1, Math.floor(props.data.length / 6))
  return props.data
    .map((d, i) => {
      if (i % step !== 0 && i !== props.data.length - 1) return null
      const p = pointFor(i, 0)
      const date = new Date(d.date)
      return {
        x: p.x,
        label: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      }
    })
    .filter(Boolean) as { x: number; label: string }[]
})

const yLabels = computed(() => {
  const ticks = 4
  return Array.from({ length: ticks + 1 }, (_, i) => {
    const v = Math.round((max.value / ticks) * (ticks - i))
    const y = PADDING.top + (innerH.value / ticks) * i
    return { y, label: v.toString() }
  })
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`"
    class="w-full h-auto"
    role="img"
    aria-label="Gráfico de actividad de publicaciones"
  >
    <!-- Y grid + labels -->
    <g v-for="t in yLabels" :key="`y-${t.y}`">
      <line
        :x1="PADDING.left"
        :x2="VIEWBOX_W - PADDING.right"
        :y1="t.y"
        :y2="t.y"
        stroke="currentColor"
        stroke-opacity="0.08"
      />
      <text
        :x="PADDING.left - 6"
        :y="t.y + 3"
        text-anchor="end"
        class="text-[10px] fill-current opacity-50"
      >
        {{ t.label }}
      </text>
    </g>

    <!-- X labels -->
    <text
      v-for="t in xLabels"
      :key="`x-${t.x}`"
      :x="t.x"
      :y="VIEWBOX_H - 10"
      text-anchor="middle"
      class="text-[10px] fill-current opacity-50"
    >
      {{ t.label }}
    </text>

    <!-- Published area -->
    <path :d="publishedArea" fill="url(#grad-published)" />
    <defs>
      <linearGradient id="grad-published" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgb(91, 91, 214)" stop-opacity="0.45" />
        <stop offset="100%" stop-color="rgb(91, 91, 214)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="publishedPath" stroke="rgb(91, 91, 214)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Scheduled (dashed line) -->
    <path
      :d="scheduledPath"
      stroke="rgb(168, 85, 247)"
      stroke-width="1.5"
      stroke-dasharray="4 3"
      fill="none"
      stroke-linecap="round"
    />

    <!-- Dots on published series -->
    <g v-if="data.length < 30">
      <circle
        v-for="(d, i) in data"
        :key="`pt-${i}`"
        :cx="pointFor(i, d.published).x"
        :cy="pointFor(i, d.published).y"
        r="3"
        fill="rgb(91, 91, 214)"
      >
        <title>{{ d.date }}: {{ d.published }} publicados, {{ d.scheduled }} programados</title>
      </circle>
    </g>
  </svg>
</template>
