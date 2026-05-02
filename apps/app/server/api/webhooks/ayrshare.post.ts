/**
 * POST /api/webhooks/ayrshare
 *
 * Recibe eventos de Ayrshare:
 * - connect / disconnect de redes sociales
 * - feedback de publicación (success/failure)
 * - métricas actualizadas
 *
 * Verifica firma con AYRSHARE_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  // Verificar firma HMAC (header 'x-ayrshare-signature')
  const signature = getHeader(event, 'x-ayrshare-signature')
  if (config.ayrshareWebhookSecret && signature) {
    const expected = createHmac('sha256', config.ayrshareWebhookSecret)
      .update(rawBody)
      .digest('hex')
    const ok =
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    if (!ok) {
      throw createError({ statusCode: 401, statusMessage: 'Firma inválida' })
    }
  }

  const payload = JSON.parse(rawBody) as {
    action?: string
    profileKey?: string
    data?: Record<string, unknown>
  }

  if (!payload.profileKey) {
    return { ok: true, ignored: 'no profileKey' }
  }

  const admin = adminClient(event)

  // Buscar org por profileKey
  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('ayrshare_profile_key', payload.profileKey)
    .maybeSingle()

  if (!org) {
    return { ok: true, ignored: 'org not found' }
  }

  // Despachar por tipo de acción
  switch (payload.action) {
    case 'social.connected':
    case 'social.disconnected':
      // TODO: actualizar tabla social_accounts
      break
    case 'post.published':
    case 'post.failed':
      // TODO: actualizar content_drafts y emitir evento Inngest
      break
    case 'analytics.updated':
      // TODO: refrescar post_metrics
      break
  }

  await admin.from('audit_log').insert({
    org_id: org.id,
    action: `webhook.ayrshare.${payload.action ?? 'unknown'}`,
    metadata: payload.data ?? {},
  })

  return { ok: true }
})
