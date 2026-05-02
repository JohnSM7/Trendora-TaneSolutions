import { inngest } from './client'
import { AyrshareClient } from '@tane/ayrshare'
import { createClient } from '@supabase/supabase-js'

/**
 * Funciones Inngest registradas.
 *
 * Cada función define un trigger (evento, cron) y los pasos.
 * Los `step.run()` son automáticamente reintentados ante fallos.
 *
 * Importante: estas funciones corren en server-side, fuera de un request HTTP,
 * así que NO podemos usar `useRuntimeConfig()` con event. Leemos `process.env`.
 */

function envSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function envAyrshare() {
  return new AyrshareClient({
    apiKey: process.env.AYRSHARE_API_KEY!,
    privateKey: process.env.AYRSHARE_PRIVATE_KEY,
    domain: process.env.AYRSHARE_DOMAIN,
  })
}

// =============================================================================
// PUBLICAR POST PROGRAMADO
// =============================================================================

export const publishScheduledPost = inngest.createFunction(
  { id: 'publish-scheduled-post', retries: 3 },
  { event: 'post.scheduled' },
  async ({ event, step }) => {
    const { draftId, orgId, scheduleAt } = event.data

    // 1. Esperar al momento exacto
    await step.sleepUntil('wait-until-scheduled', new Date(scheduleAt))

    // 2. Cargar draft + org (puede haber sido cancelado)
    type LoadedDraft = {
      id: string
      status: string
      body: string
      bodies_per_platform: Record<string, string> | null
      platforms: string[]
      hashtags: string[] | null
      media: unknown
      org_id: string
    }
    type LoadedOrg = { id: string; ayrshare_profile_key: string | null; plan: string }
    const loaded = (await step.run('load-draft-and-org', async () => {
      const sb = envSupabase()
      const { data: d } = await sb
        .from('content_drafts')
        .select('id, status, body, bodies_per_platform, platforms, hashtags, media, org_id')
        .eq('id', draftId)
        .single()
      if (!d) throw new Error('Draft no existe')
      const draftAny = d as unknown as LoadedDraft
      if (['cancelled', 'failed', 'published'].includes(draftAny.status)) {
        throw new Error(`Draft en estado ${draftAny.status}, abortando`)
      }
      const { data: o } = await sb
        .from('organizations')
        .select('id, ayrshare_profile_key, plan')
        .eq('id', orgId)
        .single()
      const orgAny = o as unknown as LoadedOrg | null
      if (!orgAny) throw new Error('Organización no existe')
      // En modo Free no necesitamos profileKey — Ayrshare publicará con cuenta primaria.
      // En modo Business sí lo necesitamos (multi-tenant).
      const isBusiness = !!process.env.AYRSHARE_PRIVATE_KEY
      if (isBusiness && !orgAny.ayrshare_profile_key) {
        throw new Error('Organización sin perfil Ayrshare en modo Business')
      }
      return { draft: draftAny, org: orgAny }
    })) as { draft: LoadedDraft; org: LoadedOrg }
    const { draft, org } = loaded

    // 3. Marcar publishing
    await step.run('mark-publishing', async () => {
      const sb = envSupabase()
      await sb.from('content_drafts').update({ status: 'publishing' }).eq('id', draftId)
    })

    // 4. Publicar vía Ayrshare por cada plataforma
    type PublishResult = {
      status: string
      errors?: unknown
      postIds?: Array<{ platform: string; id: string; status: string; postUrl?: string }>
    }
    const result = (await step.run('publish-to-ayrshare', async () => {
      const ayr = envAyrshare()
      const mediaUrls =
        (draft.media as Array<{ url?: string }> | null)?.map((m) => m?.url).filter(Boolean) ?? []

      // En Free pasamos null/undefined; en Business pasamos el profileKey de la org
      const response = await ayr.post(org.ayrshare_profile_key, {
        post: draft.body,
        platforms: draft.platforms as never,
        mediaUrls: mediaUrls as string[],
        hashtags: draft.hashtags ?? undefined,
      })
      return response
    })) as PublishResult

    // 5. Actualizar status final
    await step.run('mark-published', async () => {
      const sb = envSupabase()
      const success = result.status === 'success'
      const postIds: Record<string, string> = {}
      for (const p of result.postIds ?? []) {
        postIds[p.platform] = p.id
      }
      await sb
        .from('content_drafts')
        .update({
          status: success ? 'published' : 'failed',
          published_at: success ? new Date().toISOString() : null,
          ayrshare_post_ids: postIds,
        })
        .eq('id', draftId)

      // Incrementar uso si fue OK
      if (success) {
        try {
          await sb.rpc('increment_org_posts_used', { _org_id: orgId })
        } catch {
          // RPC opcional — si no existe aún, ignoramos
        }
      }
    })

    if (result.status !== 'success') {
      // Emitir evento de fallo para alerta + retry policy distinta
      await step.sendEvent('emit-failure', {
        name: 'post.publish.failed',
        data: {
          draftId,
          orgId,
          error: JSON.stringify(result.errors ?? result),
          retryCount: 0,
        },
      })
      throw new Error('Publicación falló — Inngest re-intentará')
    }

    return { ok: true, draftId, postIds: result.postIds }
  },
)

// =============================================================================
// HANDLER DE FALLOS DE PUBLICACIÓN (notificaciones)
// =============================================================================

export const handlePublishFailure = inngest.createFunction(
  { id: 'handle-publish-failure' },
  { event: 'post.publish.failed' },
  async ({ event, step }) => {
    const { draftId, orgId, error } = event.data

    await step.run('audit', async () => {
      const sb = envSupabase()
      await sb.from('audit_log').insert({
        org_id: orgId,
        action: 'post.publish.failed',
        target_type: 'content_drafts',
        target_id: draftId,
        metadata: { error },
      })
    })

    // TODO: enviar email Resend al owner de la org
    return { ok: true }
  },
)

// =============================================================================
// CRON: SYNC MÉTRICAS CADA 6H
// =============================================================================

export const fetchMetricsCron = inngest.createFunction(
  { id: 'fetch-metrics-cron' },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    type OrgRow = { id: string; ayrshare_profile_key: string | null }
    const orgs = (await step.run('list-active-orgs', async () => {
      const sb = envSupabase()
      const { data } = await sb
        .from('organizations')
        .select('id, ayrshare_profile_key')
        .neq('plan', 'trial')
        .not('ayrshare_profile_key', 'is', null)
      return data ?? []
    })) as OrgRow[]

    // Fan-out
    await Promise.all(
      orgs.map((o: OrgRow) =>
        step.sendEvent(`metrics-${o.id}`, {
          name: 'post.metrics.fetch',
          data: { orgId: o.id },
        }),
      ),
    )

    return { orgsScheduled: orgs.length }
  },
)

export const fetchOrgMetrics = inngest.createFunction(
  { id: 'fetch-org-metrics', concurrency: 5 },
  { event: 'post.metrics.fetch' },
  async ({ event, step }) => {
    const { orgId } = event.data

    type RecentPost = {
      id: string
      ayrshare_post_ids: Record<string, string> | null
      platforms: string[]
    }
    const recentPosts = (await step.run('list-recent-published', async () => {
      const sb = envSupabase()
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await sb
        .from('content_drafts')
        .select('id, ayrshare_post_ids, platforms')
        .eq('org_id', orgId)
        .eq('status', 'published')
        .gte('published_at', since)
        .limit(100)
      return data ?? []
    })) as RecentPost[]

    const profileKey = (await step.run('load-profile-key', async () => {
      const sb = envSupabase()
      const { data } = await sb
        .from('organizations')
        .select('ayrshare_profile_key')
        .eq('id', orgId)
        .single()
      return (data as { ayrshare_profile_key: string | null } | null)?.ayrshare_profile_key ?? null
    })) as string | null

    if (!profileKey) return { skipped: 'no-profile-key' }

    const ayr = envAyrshare()

    for (const post of recentPosts) {
      const postIds = (post.ayrshare_post_ids ?? {}) as Record<string, string>

      for (const [platform, ayrId] of Object.entries(postIds)) {
        await step.run(`metrics-${post.id}-${platform}`, async () => {
          try {
            const data = (await ayr.analyticsForPost(profileKey, {
              id: ayrId,
              platforms: [platform as any],
            })) as any

            const m = data?.[platform] ?? {}
            const sb = envSupabase()
            await sb.from('post_metrics').insert({
              org_id: orgId,
              draft_id: post.id,
              platform,
              ayrshare_post_id: ayrId,
              impressions: m.impressions ?? 0,
              reach: m.reach ?? 0,
              likes: m.likes ?? m.likeCount ?? 0,
              comments: m.comments ?? m.commentCount ?? 0,
              shares: m.shares ?? m.shareCount ?? 0,
              saves: m.saves ?? 0,
              clicks: m.clicks ?? m.linkClicks ?? 0,
              video_views: m.videoViews ?? 0,
              raw: m,
            })
          } catch (e) {
            // Silencioso por post; no bloqueamos toda la org
            console.warn(`metrics fetch failed for ${ayrId}:`, e)
          }
        })
      }
    }

    return { ok: true, postsProcessed: recentPosts.length }
  },
)

// =============================================================================
// CRON: AVISO DE TRIAL EXPIRA EN 3 DÍAS
// =============================================================================

export const trialEndingReminder = inngest.createFunction(
  { id: 'trial-ending-reminder' },
  { cron: '0 9 * * *' },
  async ({ step }) => {
    const targets = await step.run('find-orgs-trial-ending', async () => {
      const sb = envSupabase()
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      const fromBound = new Date(inThreeDays.getTime() - 12 * 60 * 60 * 1000)
      const { data } = await sb
        .from('organizations')
        .select('id, name, trial_ends_at')
        .eq('plan', 'trial')
        .gte('trial_ends_at', fromBound.toISOString())
        .lte('trial_ends_at', inThreeDays.toISOString())
      return data ?? []
    })

    for (const org of targets) {
      await step.run(`notify-${org.id}`, async () => {
        // TODO: localizar owner email y enviar Resend con CTA upgrade
        return { orgId: org.id, sent: true }
      })
    }

    return { count: targets.length }
  },
)

// =============================================================================
// EVENTO: USUARIO SE REGISTRA → SECUENCIA DE BIENVENIDA
// =============================================================================

export const onboardingSequence = inngest.createFunction(
  { id: 'onboarding-sequence' },
  { event: 'user.signup' },
  async ({ event, step }) => {
    const { userId, email } = event.data

    // Día 0: bienvenida inmediata
    await step.run('email-welcome', async () => {
      // TODO: Resend.send({ template: 'welcome', to: email })
      return { sent: 'welcome' }
    })

    // Día 1: tip de onboarding
    await step.sleep('wait-day-1', '1d')
    await step.run('email-day-1', async () => {
      // TODO: tip "conecta tu primera red"
      return { sent: 'day-1' }
    })

    // Día 3: ¿necesitas ayuda?
    await step.sleep('wait-day-3', '2d')
    await step.run('email-day-3', async () => {
      return { sent: 'day-3' }
    })

    // Día 7: caso de éxito + reminder
    await step.sleep('wait-day-7', '4d')
    await step.run('email-day-7', async () => {
      return { sent: 'day-7' }
    })

    // Día 12: trial acaba en 2 días
    await step.sleep('wait-day-12', '5d')
    await step.run('email-day-12', async () => {
      return { sent: 'day-12' }
    })

    return { userId, email, ok: true }
  },
)

// =============================================================================
// EXPORT
// =============================================================================

export const functions = [
  publishScheduledPost,
  handlePublishFailure,
  fetchMetricsCron,
  fetchOrgMetrics,
  trialEndingReminder,
  onboardingSequence,
]
