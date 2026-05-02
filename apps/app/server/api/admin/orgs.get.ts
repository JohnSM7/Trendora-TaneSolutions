/**
 * GET /api/admin/orgs
 *
 * Lista todas las organizaciones de la plataforma con KPIs agregados.
 * Solo accesible para platform_admins.
 */
export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const { data: orgs, error } = await admin
    .from('organizations')
    .select(`
      id, slug, name, plan, vertical,
      stripe_customer_id, stripe_subscription_id,
      current_period_end, cancel_at_period_end,
      posts_used_this_period, ai_credits_used_this_period,
      ayrshare_profile_key,
      created_at, deleted_at
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Para cada org, contamos miembros (consulta separada — más limpio que un
  // join complejo y son pocas orgs en esta fase).
  const orgIds = orgs?.map((o) => o.id) ?? []
  const { data: membershipCounts } = await admin
    .from('memberships')
    .select('org_id')
    .in('org_id', orgIds)

  const countByOrg = new Map<string, number>()
  for (const m of membershipCounts ?? []) {
    countByOrg.set(m.org_id, (countByOrg.get(m.org_id) ?? 0) + 1)
  }

  // Posts publicados (count) por org
  const { data: drafts } = await admin
    .from('content_drafts')
    .select('org_id, status')
    .in('org_id', orgIds)

  const publishedByOrg = new Map<string, number>()
  const draftsByOrg = new Map<string, number>()
  for (const d of drafts ?? []) {
    if (d.status === 'published') {
      publishedByOrg.set(d.org_id, (publishedByOrg.get(d.org_id) ?? 0) + 1)
    } else if (['draft', 'in_review', 'scheduled'].includes(d.status)) {
      draftsByOrg.set(d.org_id, (draftsByOrg.get(d.org_id) ?? 0) + 1)
    }
  }

  return {
    orgs: (orgs ?? []).map((o) => ({
      ...o,
      members_count: countByOrg.get(o.id) ?? 0,
      published_count: publishedByOrg.get(o.id) ?? 0,
      drafts_count: draftsByOrg.get(o.id) ?? 0,
    })),
    total: orgs?.length ?? 0,
  }
})
