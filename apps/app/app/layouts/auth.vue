<template>
  <div class="min-h-screen grid place-items-center bg-tane-paper px-4">
    <div class="w-full max-w-md">
      <NuxtLink to="/" class="flex items-center gap-2 font-display font-semibold mb-8 justify-center">
        <span class="grid h-9 w-9 place-items-center rounded-md bg-tane-primary text-white">T</span>
        <span class="text-lg">Trendora</span>
      </NuxtLink>

      <div class="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
        <slot />
      </div>

      <p class="text-center text-xs text-tane-muted mt-6">
        © {{ new Date().getFullYear() }} Tane Solutions
      </p>
    </div>
  </div>
</template>
