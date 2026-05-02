import Stripe from 'stripe'

let _client: Stripe | null = null

export function stripe(): Stripe {
  if (_client) return _client
  const config = useRuntimeConfig()
  if (!config.stripeSecretKey) throw new Error('STRIPE_SECRET_KEY no configurada')
  _client = new Stripe(config.stripeSecretKey, { apiVersion: '2025-11-30.acacia' as any })
  return _client
}

/** Resuelve un priceId desde plan + periodo. */
export function priceIdFor(plan: 'starter' | 'pro' | 'agency', period: 'monthly' | 'yearly'): string {
  const env = process.env
  const map: Record<string, string | undefined> = {
    'starter:monthly': env.STRIPE_PRICE_STARTER_MONTHLY,
    'starter:yearly': env.STRIPE_PRICE_STARTER_YEARLY,
    'pro:monthly': env.STRIPE_PRICE_PRO_MONTHLY,
    'pro:yearly': env.STRIPE_PRICE_PRO_YEARLY,
    'agency:monthly': env.STRIPE_PRICE_AGENCY_MONTHLY,
    'agency:yearly': env.STRIPE_PRICE_AGENCY_YEARLY,
  }
  const id = map[`${plan}:${period}`]
  if (!id) throw new Error(`Price ID no configurado para ${plan}:${period}`)
  return id
}
