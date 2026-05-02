/**
 * GET /api/orgs/:slug/dashboard
 *
 * Datos agregados para la pantalla home del cliente: KPIs con deltas,
 * timeline de actividad 14d, próximos posts, mejores horas, redes activas.
 *
 * Toda la query usa la sesión del user (RLS por org_id) — no hay riesgo
 * de leak cross-tenant.
 */
import { z } from 'zod'

const Params = z.object({ slug: z.string().min(3).max(40) })

const PLAN_AI_CREDITS: Record<string, number> = {
  trial: 100,
  starter: 500,
  pro: 2000,
  agency: 10000,
  enterprise: 50000,
}

const PLAN_POST_LIMIT: Record<string, number> = {
  trial: 30,
  starter: 100,
  pro: 500,
  agency: 2000,
  enterprise: 10000,
}

export default defineEventHandler(async (event) => {
  const { slug } = Params.parse(getRouterParams(event))
  const { org, supabase } = await requireOrgMember(event, slug)

  const now = Date.now()
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0))
  const days14Ago = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()
  const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const days60Ago = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString()
  const next7Days = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: orgFull },
    { data: drafts30d },
    { data: drafts60d },
    { data: upcomingDrafts },
    { data: metrics30d },
    { data: socialAccounts },
    { data: brandKits },
    { count: pendingApprovals },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('plan, ai_credits_used_this_period, posts_used_this_period, trial_ends_at, current_period_end')
      .eq('id', org.id)
      .single(),
    supabase
      .from('content_drafts')
      .select('id, status, scheduled_at, published_at, platforms, created_at')
      .eq('org_id', org.id)
      .gte('created_at', days30Ago),
    supabase
      .from('content_drafts')
      .select('id, published_at, status')
      .eq('org_id', org.id)
      .eq('status', 'published')
      .gte('published_at', days60Ago)
      .lt('published_at', days30Ago),
    supabase
      .from('content_drafts')
      .select('id, title, body, status, scheduled_at, platforms')
      .eq('org_id', org.id)
      .in('status', ['scheduled', 'in_review', 'approved'])
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', new Date(now).toISOString())
      .lte('scheduled_at', next7Days)
      .order('scheduled_at', { ascending: true })
      .limit(10),
    supabase
      .from('post_metrics')
      .select('platform, impressions, reach, likes, comments, shares, fetched_at')
      .eq('org_id', org.id)
      .gte('fetched_at', days30Ago),
    supabase
      .from('social_accounts')
      .select('platform, handle, display_name, status, profile_image_url')
      .eq('org_id', org.id),
    supabase
      .from('brand_kits')
      .select('id, name, is_default, primary_color, accent_color, logo_url')
      .eq('org_id', org.id),
    supabase
      .from('approvals')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('decision', 'pending'),
  ])

  // ---- KPIs ----
  const publishedLast30d = (drafts30d ?? []).filter((d) => d.status === 'published').length
  const publishedPrev30d = (drafts60d ?? []).length
  const publishedDelta = publishedPrev30d > 0
    ? Math.round(((publishedLast30d - publishedPrev30d) / publishedPrev30d) * 100)
    : null

  const scheduledNext7d = (upcomingDrafts ?? []).filter((d) => d.status === 'scheduled').length

  // Reach + impressions (best-effort, cliente decide qué métrica le importa)
  const reach30d = (metrics30d ?? []).reduce((acc, m) => acc + (m.reach ?? 0), 0)
  const impressions30d = (metrics30d ?? []).reduce((acc, m) => acc + (m.impressions ?? 0), 0)
  const engagements30d = (metrics30d ?? []).reduce(
    (acc, m) => acc + (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0),
    0,
  )

  const aiCreditsLimit = PLAN_AI_CREDITS[orgFull?.plan ?? 'trial'] ?? 100
  const aiCreditsUsed = orgFull?.ai_credits_used_this_period ?? 0
  const aiCreditsPct = Math.round((aiCreditsUsed / aiCreditsLimit) * 100)

  const postsLimit = PLAN_POST_LIMIT[orgFull?.plan ?? 'trial'] ?? 30
  const postsUsed = orgFull?.posts_used_this_period ?? 0

  // ---- Timeline 14 días ----
  // Por cada día contamos publicaciones + scheduled
  const daysIso: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfDay.getTime() - i * 24 * 60 * 60 * 1000)
    daysIso.push(d.toISOString().slice(0, 10))
  }
  const publishedByDay = new Map<string, number>(daysIso.map((d) => [d, 0]))
  const scheduledByDay = new Map<string, number>(daysIso.map((d) => [d, 0]))
  for (const d of drafts30d ?? []) {
    if (d.status === 'published' && d.published_at) {
      const day = d.published_at.slice(0, 10)
      if (publishedByDay.has(day)) publishedByDay.set(day, publishedByDay.get(day)! + 1)
    }
    if (d.status === 'scheduled' && d.scheduled_at) {
      const day = d.scheduled_at.slice(0, 10)
      if (scheduledByDay.has(day)) scheduledByDay.set(day, scheduledByDay.get(day)! + 1)
    }
  }
  const timeline = daysIso.map((d) => ({
    date: d,
    published: publishedByDay.get(d) ?? 0,
    scheduled: scheduledByDay.get(d) ?? 0,
  }))

  // ---- Mejores horas (últimos 30 días, agrupado por hora 0-23) ----
  const byHour = new Map<number, number>()
  for (let h = 0; h < 24; h++) byHour.set(h, 0)
  for (const d of drafts30d ?? []) {
    if (d.status === 'published' && d.published_at) {
      const h = new Date(d.published_at).getHours()
      byHour.set(h, (byHour.get(h) ?? 0) + 1)
    }
  }
  const bestHoursMatrix: number[] = Array.from(byHour.values())
  const peakHour = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0]

  // ---- Métricas por plataforma ----
  const byPlatform = new Map<string, { impressions: number; engagements: number }>()
  for (const m of metrics30d ?? []) {
    const cur = byPlatform.get(m.platform) ?? { impressions: 0, engagements: 0 }
    cur.impressions += m.impressions ?? 0
    cur.engagements += (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0)
    byPlatform.set(m.platform, cur)
  }

  // ---- Trial countdown ----
  let trialDaysLeft: number | null = null
  if (orgFull?.plan === 'trial' && orgFull.trial_ends_at) {
    const ms = new Date(orgFull.trial_ends_at).getTime() - now
    trialDaysLeft = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
  }

  return {
    plan: orgFull?.plan ?? 'trial',
    trialDaysLeft,
    kpis: {
      publishedLast30d,
      publishedDelta,
      scheduledNext7d,
      pendingApprovals: pendingApprovals ?? 0,
      reach30d,
      impressions30d,
      engagements30d,
      aiCreditsUsed,
      aiCreditsLimit,
      aiCreditsPct,
      postsUsed,
      postsLimit,
    },
    timeline,
    upcomingPosts: upcomingDrafts ?? [],
    bestHours: {
      hours: bestHoursMatrix,
      peak: peakHour ? { hour: peakHour[0], count: peakHour[1] } : null,
    },
    socialAccounts: socialAccounts ?? [],
    brandKits: brandKits ?? [],
    metricsByPlatform: Object.fromEntries(byPlatform),
  }
})
