/**
 * GET /api/admin/summary
 *
 * Datos para la home del panel admin Tane:
 *  - KPIs platform-wide
 *  - Timeline 30 días (orgs nuevas + posts publicados)
 *  - Top 5 orgs por posts publicados
 *  - Top 5 orgs por gasto IA
 *  - Activity feed cross-tenant (últimas 30 acciones)
 */
const PLAN_PRICE_EUR: Record<string, number> = {
  trial: 0,
  starter: 29,
  pro: 79,
  agency: 199,
  enterprise: 599,
}

export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const now = Date.now()
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0))
  const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: orgs },
    { data: orgsCreated30d },
    { data: drafts },
    { data: generations },
    { count: pendingRequests },
    { data: recentAudit },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, slug, name, plan, current_period_end, cancel_at_period_end, created_at')
      .is('deleted_at', null),
    admin
      .from('organizations')
      .select('id, created_at')
      .gte('created_at', days30Ago)
      .is('deleted_at', null),
    admin
      .from('content_drafts')
      .select('id, org_id, status, published_at')
      .eq('status', 'published')
      .gte('published_at', days30Ago),
    admin
      .from('generations')
      .select('id, org_id, cost_usd, generation_type, created_at')
      .gte('created_at', days30Ago),
    admin
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'social.connection_requested')
      .gte('created_at', days30Ago),
    admin
      .from('audit_log')
      .select('id, action, target_type, metadata, org_id, user_id, created_at, organizations:org_id(slug, name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  // ---- KPIs ----
  const orgsByPlan = new Map<string, number>()
  let mrrEur = 0
  for (const o of orgs ?? []) {
    orgsByPlan.set(o.plan, (orgsByPlan.get(o.plan) ?? 0) + 1)
    if (!o.cancel_at_period_end && o.plan !== 'trial') {
      mrrEur += PLAN_PRICE_EUR[o.plan] ?? 0
    }
  }

  const aiCostUsd = generations?.reduce((acc, g) => acc + Number(g.cost_usd ?? 0), 0) ?? 0

  const generationsByType = new Map<string, number>()
  for (const g of generations ?? []) {
    generationsByType.set(g.generation_type, (generationsByType.get(g.generation_type) ?? 0) + 1)
  }

  // ---- Timeline 30 días ----
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfDay.getTime() - i * 24 * 60 * 60 * 1000)
    days.push(d.toISOString().slice(0, 10))
  }
  const newOrgsByDay = new Map<string, number>(days.map((d) => [d, 0]))
  const publishedByDay = new Map<string, number>(days.map((d) => [d, 0]))

  for (const o of orgsCreated30d ?? []) {
    const day = o.created_at?.slice(0, 10)
    if (day && newOrgsByDay.has(day)) newOrgsByDay.set(day, newOrgsByDay.get(day)! + 1)
  }
  for (const d of drafts ?? []) {
    const day = d.published_at?.slice(0, 10)
    if (day && publishedByDay.has(day)) publishedByDay.set(day, publishedByDay.get(day)! + 1)
  }

  const timeline = days.map((d) => ({
    date: d,
    newOrgs: newOrgsByDay.get(d) ?? 0,
    published: publishedByDay.get(d) ?? 0,
  }))

  // ---- Top orgs por posts publicados (últimos 30d) ----
  const postsByOrg = new Map<string, number>()
  for (const d of drafts ?? []) {
    postsByOrg.set(d.org_id, (postsByOrg.get(d.org_id) ?? 0) + 1)
  }
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]))
  const topByPosts = Array.from(postsByOrg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([orgId, count]) => {
      const o = orgById.get(orgId)
      return o ? { id: orgId, slug: o.slug, name: o.name, plan: o.plan, count } : null
    })
    .filter(Boolean)

  // ---- Top orgs por gasto IA (últimos 30d) ----
  const costByOrg = new Map<string, number>()
  for (const g of generations ?? []) {
    costByOrg.set(g.org_id, (costByOrg.get(g.org_id) ?? 0) + Number(g.cost_usd ?? 0))
  }
  const topByCost = Array.from(costByOrg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([orgId, cost]) => {
      const o = orgById.get(orgId)
      return o ? { id: orgId, slug: o.slug, name: o.name, plan: o.plan, costUsd: Math.round(cost * 10000) / 10000 } : null
    })
    .filter(Boolean)

  // ---- Activity feed con resolución de org info ----
  const activityFeed = (recentAudit ?? []).map((a: any) => ({
    id: a.id,
    action: a.action,
    targetType: a.target_type,
    metadata: a.metadata,
    createdAt: a.created_at,
    orgSlug: a.organizations?.slug ?? null,
    orgName: a.organizations?.name ?? null,
  }))

  return {
    totals: {
      orgs: orgs?.length ?? 0,
      newOrgs30d: orgsCreated30d?.length ?? 0,
      mrrEur,
      postsPublished30d: drafts?.length ?? 0,
      aiCostUsd30d: Math.round(aiCostUsd * 100) / 100,
      pendingConnectionRequests: pendingRequests ?? 0,
    },
    orgsByPlan: Object.fromEntries(orgsByPlan),
    generationsByType: Object.fromEntries(generationsByType),
    timeline,
    topByPosts,
    topByCost,
    activityFeed,
  }
})
