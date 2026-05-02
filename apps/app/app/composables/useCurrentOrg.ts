/**
 * Composable que resuelve la organización actual desde el slug en la URL.
 * Cachea por sesión, recarga si cambia el slug.
 */
export interface CurrentOrg {
  id: string
  slug: string
  name: string
  plan: string
  vertical: string | null
  ayrshare_profile_key: string | null
}

export function useCurrentOrg() {
  const route = useRoute()
  const supabase = useDb()

  const slug = computed(() => (route.params.org as string | undefined) ?? null)

  const { data: currentOrg, refresh } = useAsyncData<CurrentOrg | null>(
    () => `org-${slug.value}`,
    async () => {
      if (!slug.value) return null
      const { data, error } = await supabase
        .from('organizations')
        .select('id, slug, name, plan, vertical, ayrshare_profile_key')
        .eq('slug', slug.value)
        .single()

      if (error) {
        console.error('useCurrentOrg error:', error)
        return null
      }
      return data as CurrentOrg
    },
    { watch: [slug] },
  )

  return { currentOrg, refresh }
}
