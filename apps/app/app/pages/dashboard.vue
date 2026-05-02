<script setup lang="ts">
/**
 * Pantalla "elige org / crea tu primera org".
 * Redirige a /[slug] cuando el usuario tiene exactamente una org.
 */
const supabase = useDb()
const user = useSupabaseUser()

definePageMeta({ layout: 'default' })

interface OrgSummary {
  id: string
  slug: string
  name: string
  role: string
}

const { data: orgs } = await useAsyncData<OrgSummary[]>('my-orgs', async () => {
  const { data } = await supabase
    .from('memberships')
    .select('role, organizations:org_id (id, slug, name)')
    .eq('user_id', user.value?.id ?? '')

  return (data ?? []).flatMap((m: any) =>
    m.organizations
      ? [{ id: m.organizations.id, slug: m.organizations.slug, name: m.organizations.name, role: m.role }]
      : [],
  )
})

if (orgs.value && orgs.value.length === 1) {
  await navigateTo(`/${orgs.value[0]!.slug}`)
}
</script>

<template>
  <div class="container max-w-2xl py-16">
    <h1 class="text-2xl font-display font-bold mb-2">Hola {{ user?.email }}</h1>
    <p class="text-tane-muted mb-8">Elige una organización o crea una nueva.</p>

    <div v-if="orgs && orgs.length" class="space-y-3 mb-8">
      <NuxtLink
        v-for="org in orgs"
        :key="org.id"
        :to="`/${org.slug}`"
        class="block rounded-lg border p-4 hover:border-tane-primary transition"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ org.name }}</p>
            <p class="text-xs text-tane-muted">{{ org.role }} · /{{ org.slug }}</p>
          </div>
          <span>→</span>
        </div>
      </NuxtLink>
    </div>

    <NuxtLink
      to="/onboarding"
      class="inline-flex items-center justify-center rounded-md bg-tane-primary px-6 py-3 text-sm font-medium text-white hover:bg-tane-primary/90 transition"
    >
      + Crear nueva organización
    </NuxtLink>
  </div>
</template>
