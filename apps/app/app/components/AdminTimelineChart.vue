<script setup lang="ts">
/**
 * Gráfico timeline para admin: barras de posts publicados +
 * línea de orgs nuevas. Tema dark.
 */
interface Point {
  date: string
  newOrgs: number
  published: number
}
interface Props {
  data: Point[]
}
const props = defineProps<Props>()

const VW = 800
const VH = 240
const PAD = { top: 12, right: 12, bottom: 32, left: 36 }

const innerW = VW - PAD.left - PAD.right
const innerH = VH - PAD.top - PAD.bottom

const maxPublished = computed(() => Math.max(1, ...props.data.map((d) => d.published)) * 1.2)
const maxOrgs = computed(() => Math.max(1, ...props.data.map((d) => d.newOrgs)) * 1.2)

const barWidth = computed(() => innerW / props.data.length * 0.65)

function publishedX(i: number) {
  const stepX = innerW / props.data.length
  return PAD.left + i * stepX + (stepX - barWidth.value) / 2
}

function publishedY(value: number) {
  return PAD.top + innerH - (value / maxPublished.value) * innerH
}

function orgsPath() {
  if (!props.data.length) return ''
  const stepX = innerW / Math.max(1, props.data.length - 1)
  return props.data
    .map((d, i) => {
      const x = PAD.left + i * stepX
      const y = PAD.top + innerH - (d.newOrgs / maxOrgs.value) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

const xLabels = computed(() => {
  const step = Math.max(1, Math.floor(props.data.length / 6))
  return props.data
    .map((d, i) => {
      if (i % step !== 0 && i !== props.data.length - 1) return null
      const date = new Date(d.date)
      const stepX = innerW / Math.max(1, props.data.length - 1)
      return {
        x: PAD.left + i * stepX,
        label: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      }
    })
    .filter(Boolean) as { x: number; label: string }[]
})
</script>

<template>
  <svg :viewBox="`0 0 ${VW} ${VH}`" class="w-full h-auto" role="img" aria-label="Actividad cross-tenant últimos 30 días">
    <!-- Grid Y -->
    <g v-for="i in 4" :key="`y-${i}`">
      <line
        :x1="PAD.left"
        :x2="VW - PAD.right"
        :y1="PAD.top + (innerH / 4) * (i - 1)"
        :y2="PAD.top + (innerH / 4) * (i - 1)"
        stroke="rgb(244, 244, 245)"
        stroke-opacity="0.06"
      />
    </g>

    <!-- Bars: posts publicados -->
    <rect
      v-for="(d, i) in data"
      :key="`bar-${i}`"
      :x="publishedX(i)"
      :y="publishedY(d.published)"
      :width="barWidth"
      :height="PAD.top + innerH - publishedY(d.published)"
      fill="rgb(245, 158, 11)"
      opacity="0.85"
      rx="2"
    >
      <title>{{ d.date }}: {{ d.published }} posts, {{ d.newOrgs }} orgs nuevas</title>
    </rect>

    <!-- Línea: nuevas orgs -->
    <path
      :d="orgsPath()"
      fill="none"
      stroke="rgb(91, 91, 214)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- X labels -->
    <text
      v-for="t in xLabels"
      :key="`x-${t.x}`"
      :x="t.x"
      :y="VH - 10"
      text-anchor="middle"
      class="text-[10px] fill-current opacity-50"
    >
      {{ t.label }}
    </text>
  </svg>
</template>
