/**
 * Middleware named: protege rutas /admin/** exigiendo platform_admin.
 *
 * Se aplica desde definePageMeta({ middleware: ['admin'] }) en cada página
 * dentro de pages/admin/. NO es global porque solo aplica a un subset de rutas.
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/auth/login', query: { next: '/admin' } })
  }

  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.value.id)
    .maybeSingle()

  if (!data) {
    return abortNavigation({
      statusCode: 403,
      statusMessage: 'Esta sección está reservada al equipo de Trendora',
    })
  }
})
