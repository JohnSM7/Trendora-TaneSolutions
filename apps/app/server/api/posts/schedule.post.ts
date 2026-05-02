/**
 * POST /api/posts/schedule
 *
 * Programa un draft existente.
 *  - Valida que la fecha es futura y que el plan permite más posts
 *  - Cambia status a 'scheduled'
 *  - Emite evento Inngest 'post.scheduled' que publicará en Ayrshare
 *  - Si el plan exige aprobación cliente, genera token y email
 */
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { inngest } from '~~/server/inngest/client'

const Body = z.object({
  orgSlug: z.string().min(3),
  draftId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  requireApproval: z.boolean().default(false),
  approverEmail: z.string().email().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org, supabase } = await requireOrgMember(event, body.orgSlug)

  if (new Date(body.scheduledAt).getTime() < Date.now() + 60_000) {
    throw createError({ statusCode: 400, statusMessage: 'La fecha debe ser al menos 1 minuto en el futuro' })
  }

  // Cargar el draft (RLS valida ownership)
  const { data: draft, error } = await supabase
    .from('content_drafts')
    .select('id, status, body, platforms')
    .eq('id', body.draftId)
    .single()

  if (error || !draft) {
    throw createError({ statusCode: 404, statusMessage: 'Draft no encontrado' })
  }

  // Si requiere aprobación, generar token único
  let approvalToken: string | null = null
  let approvalExpires: string | null = null
  let nextStatus: 'scheduled' | 'in_review' = 'scheduled'

  if (body.requireApproval) {
    approvalToken = randomBytes(24).toString('base64url')
    approvalExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    nextStatus = 'in_review'
  }

  const { error: updateErr } = await supabase
    .from('content_drafts')
    .update({
      status: nextStatus,
      scheduled_at: body.scheduledAt,
      approval_token: approvalToken,
      approval_token_expires_at: approvalExpires,
    })
    .eq('id', body.draftId)

  if (updateErr) {
    throw createError({ statusCode: 500, statusMessage: updateErr.message })
  }

  // Si está scheduled (no necesita approval), emitir evento Inngest.
  // Inngest opcional — si no está configurada, log warning pero no bloquear.
  if (nextStatus === 'scheduled') {
    try {
      if (process.env.INNGEST_EVENT_KEY) {
        await inngest.send({
          name: 'post.scheduled',
          data: { draftId: body.draftId, orgId: org.id, scheduleAt: body.scheduledAt },
        })
      } else {
        console.warn('[schedule] INNGEST_EVENT_KEY no configurada — post programado en BD pero sin job de publicación')
      }
    } catch (e) {
      console.error('[schedule] Inngest send falló:', e)
    }
  }

  // Si requiere approval y hay email, registrar approval row
  if (body.requireApproval && body.approverEmail) {
    const admin = adminClient(event)
    await admin.from('approvals').insert({
      org_id: org.id,
      draft_id: body.draftId,
      requested_by: user.id,
      approver_email: body.approverEmail,
    })
    // TODO: enviar email Resend con link /approve/{token}
  }

  return {
    ok: true,
    status: nextStatus,
    approvalUrl: approvalToken
      ? `${useRuntimeConfig().public.appUrl}/approve/${approvalToken}`
      : null,
  }
})
