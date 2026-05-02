/**
 * POST /api/billing/checkout
 *
 * Crea sesión de Stripe Checkout. Devuelve URL para redirigir.
 * Si la org aún no tiene customer Stripe, lo crea primero.
 */
import { z } from 'zod'

const Body = z.object({
  orgSlug: z.string().min(3),
  plan: z.enum(['starter', 'pro', 'agency']),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org, supabase } = await requireOrgMember(event, body.orgSlug)
  const config = useRuntimeConfig()
  const s = stripe()

  // Crear customer si no existe
  const admin = adminClient(event)
  const { data: orgFull } = await admin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', org.id)
    .single()

  let customerId = orgFull?.stripe_customer_id
  if (!customerId) {
    const customer = await s.customers.create({
      email: user.email!,
      name: orgFull?.name ?? org.name,
      metadata: { org_id: org.id, org_slug: org.slug },
    })
    customerId = customer.id
    await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id)
  }

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceIdFor(body.plan, body.period), quantity: 1 }],
    success_url: `${config.public.appUrl}/${org.slug}/settings/billing?success=1`,
    cancel_url: `${config.public.appUrl}/${org.slug}/settings/billing?cancelled=1`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id: org.id, plan: body.plan, period: body.period },
    },
  })

  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear la sesión de checkout' })
  }

  return { url: session.url }
})
