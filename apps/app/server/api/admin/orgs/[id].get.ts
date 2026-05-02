/**
 * GET /api/admin/orgs/:id
 *
 * Detalle completo de una organización: equipo, drafts recientes, billing,
 * audit log de los últimos 50 eventos, generaciones IA con coste.
 */
import { z } from 'zod'

const Params = z.object({ id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)
  const { id } = Params.parse(getRouterParams(event))

  const [
    { data: org },
    { data: members },
    { data: drafts },
    { data: audit },
    { data: generations },
    { data: meter },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('memberships')
      .select('user_id, role, created_at, accepted_at')
      .eq('org_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('content_drafts')
      .select('id, title, body, status, platforms, scheduled_at, published_at, created_at')
      .eq('org_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('audit_log')
      .select('id, action, target_type, target_id, metadata, user_id, created_at')
      .eq('org_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('generations')
      .select('id, generation_type, model, input_tokens, output_tokens, cost_usd, created_at')
      .eq('org_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    admin
      .from('usage_meter')
      .select('*')
      .eq('org_id', id)
      .maybeSingle(),
  ])

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organización no encontrada' })
  }

  // Resolvemos los emails de los miembros desde auth.users
  const memberIds = (members ?? []).map((m) => m.user_id)
  const memberEmails = new Map<string, string>()
  if (memberIds.length) {
    const { data: users } = await admin.auth.admin.listUsers()
    for (const u of users?.users ?? []) {
      if (memberIds.includes(u.id) && u.email) memberEmails.set(u.id, u.email)
    }
  }

  return {
    org,
    members: (members ?? []).map((m) => ({
      ...m,
      email: memberEmails.get(m.user_id) ?? '(desconocido)',
    })),
    drafts: drafts ?? [],
    audit: audit ?? [],
    generations: generations ?? [],
    meter: meter ?? null,
    totalCostUsd:
      generations?.reduce((acc, g) => acc + Number(g.cost_usd ?? 0), 0) ?? 0,
  }
})
