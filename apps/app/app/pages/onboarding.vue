<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useDb()

const name = ref('')
const slug = ref('')
const vertical = ref('restaurante')
const creating = ref(false)
const error = ref<string | null>(null)

const VERTICALES = [
  { value: 'restaurante', label: 'Restaurante / bar / cafetería' },
  { value: 'gimnasio', label: 'Gimnasio / fitness' },
  { value: 'clinica-dental', label: 'Clínica dental' },
  { value: 'peluqueria', label: 'Peluquería / barbería' },
  { value: 'tienda', label: 'Tienda física / comercio' },
  { value: 'saas-b2b', label: 'SaaS B2B / startup' },
  { value: 'otro', label: 'Otro' },
]

watch(name, (v) => {
  if (!slug.value || slug.value === slugify(name.value.slice(0, -1))) {
    slug.value = slugify(v)
  }
})

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function createOrg() {
  creating.value = true
  error.value = null
  try {
    const result = await $fetch<{ id: string; slug: string }>('/api/orgs/create', {
      method: 'POST',
      body: {
        name: name.value,
        slug: slug.value,
        vertical: vertical.value,
      },
    })
    await navigateTo(`/${result.slug}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? e?.data?.message ?? e.message ?? 'Error desconocido'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-xl font-display font-semibold mb-2">Crea tu organización</h1>
    <p class="text-sm text-tane-muted mb-6">
      Una organización por marca o cliente. Podrás añadir más después.
    </p>

    <form class="space-y-4" @submit.prevent="createOrg">
      <div>
        <label class="text-sm font-medium" for="name">Nombre de la organización</label>
        <input
          id="name"
          v-model="name"
          required
          placeholder="Pizzería La Strada"
          class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tane-primary/20"
        />
      </div>

      <div>
        <label class="text-sm font-medium" for="slug">URL en Trendora</label>
        <div class="mt-1 flex rounded-md border focus-within:ring-2 focus-within:ring-tane-primary/20">
          <span class="px-3 py-2 text-sm text-tane-muted bg-muted border-r whitespace-nowrap">trendora.tanesolutions.com/app/</span>
          <input
            id="slug"
            v-model="slug"
            required
            pattern="[a-z0-9\-]+"
            minlength="3"
            maxlength="40"
            class="flex-1 px-3 py-2 text-sm bg-background focus:outline-none rounded-r-md"
          />
        </div>
        <p class="text-xs text-tane-muted mt-1">Entre 3 y 40 caracteres. Solo minúsculas, números y guiones.</p>
      </div>

      <div>
        <label class="text-sm font-medium" for="vertical">Sector</label>
        <select
          id="vertical"
          v-model="vertical"
          class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tane-primary/20"
        >
          <option v-for="v in VERTICALES" :key="v.value" :value="v.value">
            {{ v.label }}
          </option>
        </select>
        <p class="text-xs text-tane-muted mt-1">
          Lo usamos para afinar plantillas y prompts a tu nicho.
        </p>
      </div>

      <button
        type="submit"
        :disabled="creating || !name || !slug"
        class="w-full rounded-md bg-tane-primary px-4 py-2 text-sm font-medium text-white hover:bg-tane-primary/90 disabled:opacity-50 transition"
      >
        {{ creating ? 'Creando…' : 'Crear organización' }}
      </button>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </form>
  </div>
</template>
