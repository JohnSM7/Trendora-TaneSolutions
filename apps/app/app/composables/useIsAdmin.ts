/**
 * Composable: detecta si el usuario actual es platform admin (Tane Solutions).
 *
 * Usa la tabla `platform_admins`. La RLS permite que cada user lea su propia
 * row, así que basta consultar con la sesión normal. Cacheamos el resultado
 * en estado global para no consultar en cada render.
 */
const isAdminState = ref<boolean | null>(null)

export function useIsAdmin() {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  async function refresh() {
    if (!user.value) {
      isAdminState.value = false
      return false
    }
    const { data } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.value.id)
      .maybeSingle()
    isAdminState.value = !!data
    return isAdminState.value
  }

  // Lazy init en cliente (no en SSR para evitar pegada extra al render).
  if (import.meta.client && isAdminState.value === null && user.value) {
    refresh()
  }

  return {
    isAdmin: computed(() => isAdminState.value === true),
    loaded: computed(() => isAdminState.value !== null),
    refresh,
  }
}
