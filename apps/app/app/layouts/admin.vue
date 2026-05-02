<script setup lang="ts">
/**
 * Layout para el panel admin de Tane Solutions (cross-tenant).
 * Visualmente diferente del layout cliente para que se note que estás en
 * "modo admin" — colores oscuros + badge ADMIN.
 */
const user = useSupabaseUser()

const nav = [
  { label: 'Resumen', href: '/admin', icon: '📊' },
  { label: 'Organizaciones', href: '/admin/orgs', icon: '🏢' },
  { label: 'Solicitudes redes', href: '/admin/connection-requests', icon: '📥' },
]

async function logout() {
  const supabase = useSupabaseClient()
  await supabase.auth.signOut()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex bg-zinc-950 text-zinc-100">
    <!-- Sidebar admin (dark) -->
    <aside class="w-64 border-r border-zinc-800 hidden md:flex flex-col">
      <div class="h-16 flex items-center justify-between px-5 border-b border-zinc-800">
        <NuxtLink to="/admin" class="flex items-center gap-2 font-display font-semibold">
          <span class="grid h-8 w-8 place-items-center rounded-md bg-amber-500 text-zinc-950 font-bold">T</span>
          <span>Trendora</span>
          <span class="text-[10px] uppercase tracking-wider bg-amber-500 text-zinc-950 font-bold rounded px-1.5 py-0.5">
            Admin
          </span>
        </NuxtLink>
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.href"
          :to="item.href"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-zinc-800 transition"
          active-class="bg-amber-500/15 text-amber-300"
          exact-active-class="bg-amber-500/15 text-amber-300"
        >
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>

        <div class="pt-4 mt-4 border-t border-zinc-800">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">Volver</p>
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-zinc-800 transition text-zinc-400"
          >
            <span>↩</span>
            Modo cliente
          </NuxtLink>
        </div>
      </nav>

      <div class="p-3 border-t border-zinc-800">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="truncate text-zinc-400">{{ user?.email }}</span>
          <button class="text-zinc-400 hover:text-zinc-100" @click="logout">Salir</button>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
