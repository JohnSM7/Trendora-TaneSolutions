/**
 * Middleware global de auth.
 *
 * Rutas públicas (no requieren auth):
 *   /auth/*    flujo de login/callback
 *   /legal/*   privacidad, términos
 *   /approve/* aprobación pública por token
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  const isPublic =
    to.path.startsWith('/auth/') ||
    to.path.startsWith('/legal/') ||
    to.path.startsWith('/approve/')

  if (!user.value && !isPublic) {
    return navigateTo({ path: '/auth/login', query: { next: to.fullPath } })
  }

  if (user.value && to.path === '/auth/login') {
    return navigateTo('/dashboard')
  }
})
