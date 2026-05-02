/**
 * POST /api/orgs/invite
 *
 * Invita a un miembro nuevo a una organización.
 * Si el email ya tiene cuenta Tane, le añade membership directamente.
 * Si no, le envía magic link con redirect a la org.
 */
import { z } from 'zod'

const Body = z.object({
  orgSlug: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org, role } = await requireOrgMember(event, body.orgSlug)

  if (role !== 'owner' && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Solo owner/admin pueden invitar' })
  }

  const config = useRuntimeConfig()
  const admin = adminClient(event)

  // ¿Existe ya un usuario con ese email?
  const { data: existingUser } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
  const found = existingUser?.users.find((u) => u.email?.toLowerCase() === body.email.toLowerCase())

  if (found) {
    // Crear membership directamente
    const { error } = await admin.from('memberships').insert({
      org_id: org.id,
      user_id: found.id,
      role: body.role,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else {
    // Enviar invite con redirect post-signup
    const { error } = await admin.auth.admin.inviteUserByEmail(body.email, {
      redirectTo: `${config.public.appUrl}/${org.slug}`,
      data: { invited_to_org: org.id, invited_role: body.role },
    })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await admin.from('audit_log').insert({
    org_id: org.id,
    user_id: user.id,
    action: 'org.member.invited',
    metadata: { email: body.email, role: body.role },
  })

  return { ok: true }
})
