<script setup lang="ts">
const user = useSupabaseUser()
const { currentOrg } = useCurrentOrg()

const nav = computed(() => {
  if (!currentOrg.value) return []
  const base = `/${currentOrg.value.slug}`
  return [
    { label: 'Dashboard', href: `${base}`, icon: 'home' },
    { label: 'Studio IA', href: `${base}/studio`, icon: 'sparkles' },
    { label: 'Borradores', href: `${base}/drafts`, icon: 'file' },
    { label: 'Calendario', href: `${base}/calendar`, icon: 'calendar' },
    { label: 'Brand Kit', href: `${base}/brand-kits`, icon: 'palette' },
    { label: 'Analítica', href: `${base}/analytics`, icon: 'bar-chart' },
    { label: 'Equipo', href: `${base}/team`, icon: 'users' },
    { label: 'Ajustes', href: `${base}/settings`, icon: 'settings' },
  ]
})

async function logout() {
  const supabase = useSupabaseClient()
  await supabase.auth.signOut()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-card hidden md:flex flex-col">
      <div class="h-16 flex items-center justify-between px-5 border-b">
        <NuxtLink to="/" class="flex items-center gap-2 font-display font-semibold">
          <span class="grid h-8 w-8 place-items-center rounded-md bg-tane-primary text-white">T</span>
          <span>Trendora</span>
        </NuxtLink>
        <ThemeToggle />
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.href"
          :to="item.href"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition"
          active-class="bg-tane-primary/10 text-tane-primary"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="p-3 border-t">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="truncate">{{ user?.email }}</span>
          <button class="text-tane-muted hover:text-foreground" @click="logout">Salir</button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
