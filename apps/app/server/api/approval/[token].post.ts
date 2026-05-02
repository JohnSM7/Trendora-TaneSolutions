/**
 * POST /api/approval/[token]
 *
 * Endpoint PÚBLICO. Recibe la decisión del cliente final (approve/reject)
 * y, si approve, programa el evento Inngest para publicar.
 */
import { z } from 'zod'
import { inngest } from '~~/server/inngest/client'

const Body = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })

  const body = await readValidatedBody(event, Body.parse)
  const admin = adminClient(event)

  const { data: draft, error } = await admin
    .from('content_drafts')
    .select('id, org_id, scheduled_at, status, approval_token_expires_at')
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

  // Insertar approval
  await admin.from('approvals').insert({
    org_id: draft.org_id,
    draft_id: draft.id,
    decision: body.decision,
    comment: body.comment ?? null,
    decided_at: new Date().toISOString(),
    ip_address: getRequestIP(event, { xForwardedFor: true }) ?? null,
    user_agent: getHeader(event, 'user-agent') ?? null,
  })

  // Actualizar draft
  if (body.decision === 'approved') {
    await admin
      .from('content_drafts')
      .update({ status: 'scheduled', approval_token: null })
      .eq('id', draft.id)

    if (draft.scheduled_at) {
      // Inngest es opcional en dev — si no está configurada, no bloqueamos la aprobación.
      // En producción debe estar para que se ejecute la publicación programada.
      try {
        if (process.env.INNGEST_EVENT_KEY) {
          await inngest.send({
            name: 'post.scheduled',
            data: { draftId: draft.id, orgId: draft.org_id, scheduleAt: draft.scheduled_at },
          })
        } else {
          console.warn(
            `[approval] Aprobación OK pero INNGEST_EVENT_KEY no configurada — el post NO se publicará automáticamente`,
          )
        }
      } catch (e) {
        console.error('[approval] Inngest send falló:', e)
        // Seguimos: la aprobación se ha registrado en BD, el job se puede re-disparar manualmente
      }
    }
  } else {
    await admin
      .from('content_drafts')
      .update({ status: 'draft', approval_token: null })
      .eq('id', draft.id)
  }

  await admin.from('audit_log').insert({
    org_id: draft.org_id,
    action: `approval.${body.decision}`,
    target_type: 'content_drafts',
    target_id: draft.id,
    metadata: { comment: body.comment ?? null },
  })

  return { ok: true }
})
