/**
 * GET /api/approval/[token]
 *
 * Endpoint PÚBLICO. Devuelve el draft asociado al token si está vigente.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })

  const admin = adminClient(event)

  const { data: draft, error } = await admin
    .from('content_drafts')
    .select(`
      id, title, body, bodies_per_platform, platforms, hashtags, media, scheduled_at,
      approval_token_expires_at,
      organizations:org_id ( name, primary_color:id )
    `)
    .eq('approval_token', token)
    .single()

  if (error || !draft) {
    throw createError({ statusCode: 404, statusMessage: 'Enlace inválido' })
  }

  if (
    draft.approval_token_expires_at &&
    new Date(draft.approval_token_expires_at).getTime() < Date.now()
  ) {
    throw createError({ statusCode: 410, statusMessage: 'Enlace expirado' })
  }

  // Estado de aprobación más reciente
  const { data: approval } = await admin
    .from('approvals')
    .select('decision')
    .eq('draft_id', draft.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    draft: {
      id: draft.id,
      title: draft.title,
      body: draft.body,
      bodies_per_platform: draft.bodies_per_platform,
      platforms: draft.platforms,
      hashtags: draft.hashtags,
      media: draft.media,
      scheduled_at: draft.scheduled_at,
    },
    org: { name: (draft as any).organizations?.name ?? '', primary_color: null },
    status: approval?.decision ?? 'pending',
    expires_at: draft.approval_token_expires_at,
  }
})
