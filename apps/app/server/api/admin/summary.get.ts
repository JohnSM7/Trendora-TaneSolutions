/**
 * GET /api/admin/summary
 *
 * KPIs de plataforma para el dashboard admin home:
 *  - orgs por plan
 *  - MRR estimado en € (suma de planes activos)
 *  - posts publicados último mes
 *  - generaciones IA + coste último mes
 *  - solicitudes de conexión pendientes
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

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: orgs },
    { data: drafts },
    { data: generations },
    { count: pendingRequests },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, plan, current_period_end, cancel_at_period_end')
      .is('deleted_at', null),
    admin
      .from('content_drafts')
      .select('id, status, published_at')
      .eq('status', 'published')
      .gte('published_at', since30d),
    admin
      .from('generations')
      .select('id, cost_usd, generation_type')
      .gte('created_at', since30d),
    admin
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'social.connection_requested')
      .gte('created_at', since30d),
  ])

  // Contar por plan + MRR
  const orgsByPlan = new Map<string, number>()
  let mrrEur = 0
  for (const o of orgs ?? []) {
    orgsByPlan.set(o.plan, (orgsByPlan.get(o.plan) ?? 0) + 1)
    if (!o.cancel_at_period_end && o.plan !== 'trial') {
      mrrEur += PLAN_PRICE_EUR[o.plan] ?? 0
    }
  }

  // Coste IA total último mes
  const aiCostUsd =
    generations?.reduce((acc, g) => acc + Number(g.cost_usd ?? 0), 0) ?? 0

  const generationsByType = new Map<string, number>()
  for (const g of generations ?? []) {
    generationsByType.set(g.generation_type, (generationsByType.get(g.generation_type) ?? 0) + 1)
  }

  return {
    totals: {
      orgs: orgs?.length ?? 0,
      mrrEur,
      postsPublished30d: drafts?.length ?? 0,
      aiCostUsd30d: Math.round(aiCostUsd * 100) / 100,
      pendingConnectionRequests: pendingRequests ?? 0,
    },
    orgsByPlan: Object.fromEntries(orgsByPlan),
    generationsByType: Object.fromEntries(generationsByType),
  }
})
