/**
 * POST /api/social/connect
 *
 * Devuelve una URL para que el cliente conecte sus redes sociales en Ayrshare.
 *
 * Detecta automáticamente plan Free vs Business:
 *   - Business (con AYRSHARE_PRIVATE_KEY): crea Profile per-org + JWT white-label.
 *   - Free (sin private key): redirige al dashboard de Ayrshare donde tú conectas
 *     tus propias redes a la cuenta primaria. Las publicaciones irán desde esa
 *     cuenta para todas las orgs.
 */
import { z } from 'zod'

const Body = z.object({ orgSlug: z.string().min(3) })

export default defineEventHandler(async (event) => {
  const { user, org } = await requireOrgMember(
    event,
    (await readValidatedBody(event, Body.parse)).orgSlug,
  )
  const ayr = ayrshare()
  const config = useRuntimeConfig()
  const admin = adminClient(event)

  const hasPrivateKey = !!(config.ayrsharePrivateKey || process.env.AYRSHARE_PRIVATE_KEY)

  // ----- Plan FREE: redirigir al dashboard de Ayrshare -----
  if (!hasPrivateKey) {
    await admin.from('audit_log').insert({
      org_id: org.id,
      user_id: user.id,
      action: 'social.connect.free_mode',
      metadata: { mode: 'free', message: 'Plan Free: usa la cuenta primaria de Ayrshare' },
    })

    return {
      url: 'https://app.ayrshare.com/social-accounts',
      mode: 'free',
      message:
        'Estás en plan Free de Ayrshare. Conecta tus redes en el dashboard de Ayrshare → todas las publicaciones irán desde esa cuenta única. Para multi-tenant (cada cliente con sus propias redes) necesitas plan Business.',
    }
  }

  // ----- Plan BUSINESS: crear Profile + JWT white-label -----
  let profileKey = org.ayrshare_profile_key
  if (!profileKey) {
    const created = await ayr.createProfile({
      title: `${org.slug} (${org.name})`,
      tags: [org.vertical ?? 'unknown'],
    })
    profileKey = created.profileKey

    await admin
      .from('organizations')
      .update({ ayrshare_profile_key: profileKey, ayrshare_profile_id: created.profileId })
      .eq('id', org.id)
  }

  const jwt = await ayr.generateJwt({
    profileKey,
    expiresIn: '30m',
    redirect: `${config.public.appUrl}/${org.slug}/settings/social?connected=1`,
  })

  if (jwt.status !== 'success' || !jwt.url) {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo generar el enlace de conexión' })
  }

  await admin.from('audit_log').insert({
    org_id: org.id,
    user_id: user.id,
    action: 'social.connect.requested',
    metadata: { profileKey, mode: 'business' },
  })

  return { url: jwt.url, mode: 'business', expiresIn: jwt.expiresIn }
})
