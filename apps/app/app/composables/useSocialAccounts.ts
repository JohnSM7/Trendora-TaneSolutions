/**
 * useSocialAccounts() — composable cacheado que devuelve las redes activas.
 *
 * Se usa en Studio y Calendar para avisar al usuario si no hay redes
 * conectadas. Cachea el resultado durante 60 segundos para evitar
 * martillear el endpoint de Ayrshare.
 */
interface ConnectedAccount {
  platform: string
  handle: string | null
  displayName: string | null
  profileImageUrl: string | null
  status: 'connected'
}

interface SocialState {
  mode: 'free' | 'business' | 'unconfigured'
  accounts: ConnectedAccount[]
  primaryEmail?: string | null
  loadedAt: number
}

export function useSocialAccounts() {
  const { currentOrg } = useCurrentOrg()
  const state = useState<SocialState | null>('social-accounts', () => null)

  async function fetchIfStale() {
    if (!currentOrg.value?.slug) return
    const TTL = 60_000
    if (state.value && Date.now() - state.value.loadedAt < TTL) return

    try {
      const data = await $fetch<{
        mode: 'free' | 'business' | 'unconfigured'
        accounts: ConnectedAccount[]
        primaryEmail?: string | null
      }>('/api/social/list', { query: { orgSlug: currentOrg.value.slug } })

      state.value = {
        mode: data.mode,
        accounts: data.accounts,
        primaryEmail: data.primaryEmail,
        loadedAt: Date.now(),
      }
    } catch {
      // En caso de error mantenemos el estado anterior
    }
  }

  watchEffect(() => {
    if (currentOrg.value) fetchIfStale()
  })

  return {
    state: readonly(state),
    accounts: computed(() => state.value?.accounts ?? []),
    hasAccounts: computed(() => (state.value?.accounts.length ?? 0) > 0),
    mode: computed(() => state.value?.mode ?? null),
    refresh: fetchIfStale,
  }
}
