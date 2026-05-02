/**
 * POST /api/billing/portal
 *
 * Crea sesión del Customer Portal para que el cliente gestione su
 * suscripción, métodos de pago, facturas, etc. self-service.
 */
import { z } from 'zod'

const Body = z.object({ orgSlug: z.string().min(3) })

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { org } = await requireOrgMember(event, body.orgSlug)
  const config = useRuntimeConfig()
  const s = stripe()

  const admin = adminClient(event)
  const { data } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', org.id)
    .single()

  if (!data?.stripe_customer_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Esta organización aún no tiene una suscripción activa.',
    })
  }

  const session = await s.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${config.public.appUrl}/${org.slug}/settings/billing`,
  })

  return { url: session.url }
})
