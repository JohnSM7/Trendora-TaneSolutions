/**
 * POST /api/webhooks/stripe
 *
 * Verifica firma Stripe y procesa eventos con idempotencia.
 *
 * Eventos esperados (configurar en Stripe Dashboard → Webhooks):
 *   - checkout.session.completed         → confirmar checkout, dar de alta plan
 *   - customer.subscription.created      → alta inicial
 *   - customer.subscription.updated      → cambio de plan, cancel_at_period_end, etc.
 *   - customer.subscription.deleted      → cancelación efectiva → degradar a trial
 *   - customer.subscription.trial_will_end → aviso D-3 fin trial → email lifecycle
 *   - invoice.payment_succeeded          → reset usage_meter, confirmar pago
 *   - invoice.payment_failed             → alertar usuario, retry policy
 */
import Stripe from 'stripe'

type Plan = 'trial' | 'starter' | 'pro' | 'agency' | 'enterprise'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sig = getHeader(event, 'stripe-signature')
  if (!sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature' })
  }

  const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe no configurado' })
  }

  const stripe = new Stripe(secretKey)
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: `Webhook signature failed: ${(err as Error).message}`,
    })
  }

  const admin = adminClient(event)

  // Idempotencia: si ya procesamos este event.id, ignorar
  const { data: existing } = await admin
    .from('stripe_events')
    .select('id')
    .eq('id', stripeEvent.id)
    .maybeSingle()
  if (existing) return { ok: true, duplicate: true }

  try {
    await processEvent(stripeEvent, admin)
  } catch (e) {
    console.error('[stripe-webhook] Error procesando', stripeEvent.type, ':', e)
    // Aún así guardamos el evento como recibido — Stripe NO reintenta si devolvemos 2xx,
    // y queremos diagnosticar fallos sin que se pierdan los datos.
  }

  // Persistir el evento (incluso si el handler falló, para debug)
  await admin.from('stripe_events').insert({
    id: stripeEvent.id,
    type: stripeEvent.type,
    payload: stripeEvent as unknown as Record<string, unknown>,
  })

  return { ok: true, type: stripeEvent.type }
})

async function processEvent(stripeEvent: Stripe.Event, admin: ReturnType<typeof adminClient>) {
  switch (stripeEvent.type) {
    // ---- CHECKOUT ------------------------------------------------------------

    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string | null

      // Solo procesamos sesiones de suscripción
      if (session.mode !== 'subscription' || !subscriptionId) return

      // El customer ya debería estar asociado a la org (creado en checkout endpoint)
      await admin
        .from('organizations')
        .update({
          stripe_subscription_id: subscriptionId,
          // No actualizamos `plan` aquí — esperamos al evento subscription.created/updated
          // que tiene el price_id real.
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    // ---- SUSCRIPCIÓN ---------------------------------------------------------

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id
      const plan = mapPriceToPlan(priceId)

      await admin
        .from('organizations')
        .update({
          plan,
          stripe_subscription_id: sub.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription

      await admin
        .from('organizations')
        .update({
          plan: 'trial' as Plan,
          stripe_subscription_id: null,
          current_period_end: null,
          cancel_at_period_end: false,
        })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.trial_will_end': {
      // Stripe lo envía 3 días antes del fin del trial.
      // TODO: dispar email lifecycle "trial_ending" via Resend
      const sub = stripeEvent.data.object as Stripe.Subscription
      console.info(
        `[stripe] Trial acaba pronto para customer ${sub.customer} (period_end ${sub.trial_end})`,
      )
      break
    }

    // ---- FACTURACIÓN ---------------------------------------------------------

    case 'invoice.payment_succeeded': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Reset uso del periodo (créditos IA, posts publicados)
      await admin
        .from('organizations')
        .update({
          posts_used_this_period: 0,
          ai_credits_used_this_period: 0,
        })
        .eq('stripe_customer_id', customerId)

      // Audit log
      const { data: org } = await admin
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (org) {
        await admin.from('audit_log').insert({
          org_id: org.id,
          action: 'billing.payment_succeeded',
          metadata: {
            amount: invoice.amount_paid,
            currency: invoice.currency,
            invoice_id: invoice.id,
          },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: org } = await admin
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (org) {
        await admin.from('audit_log').insert({
          org_id: org.id,
          action: 'billing.payment_failed',
          metadata: {
            amount: invoice.amount_due,
            currency: invoice.currency,
            invoice_id: invoice.id,
            attempt_count: invoice.attempt_count,
          },
        })
        // TODO: dispar email de aviso de fallo de pago
      }
      break
    }

    default: {
      // Evento no manejado — solo lo dejamos en stripe_events para debug
      console.info(`[stripe] Evento no manejado: ${stripeEvent.type}`)
    }
  }
}

/**
 * Mapea price_id de Stripe → plan interno.
 * Lee los IDs de price desde env vars (configurables sin deploy).
 */
function mapPriceToPlan(priceId: string | undefined): Plan {
  if (!priceId) return 'trial'

  const env = process.env
  const map: Record<string, Plan> = {}
  if (env.STRIPE_PRICE_STARTER_MONTHLY) map[env.STRIPE_PRICE_STARTER_MONTHLY] = 'starter'
  if (env.STRIPE_PRICE_STARTER_YEARLY) map[env.STRIPE_PRICE_STARTER_YEARLY] = 'starter'
  if (env.STRIPE_PRICE_PRO_MONTHLY) map[env.STRIPE_PRICE_PRO_MONTHLY] = 'pro'
  if (env.STRIPE_PRICE_PRO_YEARLY) map[env.STRIPE_PRICE_PRO_YEARLY] = 'pro'
  if (env.STRIPE_PRICE_AGENCY_MONTHLY) map[env.STRIPE_PRICE_AGENCY_MONTHLY] = 'agency'
  if (env.STRIPE_PRICE_AGENCY_YEARLY) map[env.STRIPE_PRICE_AGENCY_YEARLY] = 'agency'

  return map[priceId] ?? 'starter'
}
