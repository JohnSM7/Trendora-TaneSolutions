/**
 * GET /api/social/list?orgSlug=xxx
 *
 * Devuelve las redes sociales conectadas que se usarán para publicar para esta org.
 *
 * Modo FREE: lee de la cuenta primaria de Ayrshare (mismas para todas las orgs)
 * Modo BUSINESS: lee del profileKey de la org (cada org las suyas)
 */
import { z } from 'zod'

const Query = z.object({ orgSlug: z.string().min(3) })

interface AyrshareUserResponse {
  activeSocialAccounts?: string[]
  displayNames?: Array<{
    platform: string
    displayName?: string
    userImage?: string
    profileUrl?: string
    type?: string
    pageName?: string
    pageId?: string
  }>
  email?: string
  monthlyPostQuota?: number
  monthlyPostCount?: number
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, Query.parse)
  const { org } = await requireOrgMember(event, query.orgSlug)

  const config = useRuntimeConfig()
  const apiKey = config.ayrshareApiKey || process.env.AYRSHARE_API_KEY
  const hasPrivateKey = !!(config.ayrsharePrivateKey || process.env.AYRSHARE_PRIVATE_KEY)

  if (!apiKey) {
    return {
      mode: 'unconfigured' as const,
      accounts: [],
      message: 'AYRSHARE_API_KEY no configurada',
    }
  }

  const ayr = ayrshare()
  let userInfo: AyrshareUserResponse

  try {
    if (hasPrivateKey && org.ayrshare_profile_key) {
      // Modo Business: leemos del profileKey de la org
      userInfo = (await ayr.listSocialAccounts(org.ayrshare_profile_key)) as AyrshareUserResponse
    } else {
      // Modo Free: leemos de la cuenta primaria
      userInfo = (await ayr.listSocialAccounts(null)) as AyrshareUserResponse
    }
  } catch (e) {
    console.error('[social/list] Ayrshare error:', e)
    return {
      mode: hasPrivateKey ? ('business' as const) : ('free' as const),
      accounts: [],
      error: 'No se pudo conectar con Ayrshare',
    }
  }

  const platforms = userInfo.activeSocialAccounts ?? []
  const displayMap = new Map(
    (userInfo.displayNames ?? []).map((d) => [d.platform, d]),
  )

  const accounts = platforms.map((p) => {
    const display = displayMap.get(p)
    return {
      platform: p,
      handle: display?.displayName ?? display?.pageName ?? null,
      displayName: display?.displayName ?? null,
      profileImageUrl: display?.userImage ?? null,
      profileUrl: display?.profileUrl ?? null,
      type: display?.type ?? null,
      status: 'connected' as const,
    }
  })

  return {
    mode: hasPrivateKey ? ('business' as const) : ('free' as const),
    accounts,
    quota: {
      used: userInfo.monthlyPostCount ?? 0,
      limit: userInfo.monthlyPostQuota ?? null,
    },
    primaryEmail: userInfo.email ?? null,
  }
})
