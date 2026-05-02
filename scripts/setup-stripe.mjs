/**
 * Crea productos + precios en Stripe (test mode) e imprime IDs para .env
 *
 * Uso: node scripts/setup-stripe.mjs
 * Idempotente: si ya existen, no los duplica.
 */
import { config as loadEnv } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '..', '.env') })

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY no configurada en .env')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLANS = [
  {
    key: 'starter',
    name: 'Trendora Starter',
    description: 'Para autónomos y micro-negocios. 3 redes, 60 posts/mes, 200 créditos IA.',
    monthly: 9900, // 99 €
    yearly: 79 * 12 * 100, // 79 €/mes × 12 = 948 €/año
    metadata: {
      networks: '3',
      posts_per_month: '60',
      ai_credits: '200',
    },
  },
  {
    key: 'pro',
    name: 'Trendora Pro',
    description: 'Para negocios establecidos. 8 redes, posts ilimitados, 1.000 créditos IA.',
    monthly: 24900, // 249 €
    yearly: 199 * 12 * 100, // 199 €/mes × 12 = 2.388 €/año
    metadata: {
      networks: '8',
      posts_per_month: 'unlimited',
      ai_credits: '1000',
    },
  },
  {
    key: 'agency',
    name: 'Trendora Agency',
    description: 'Para agencias y multi-marca. 30 redes, white-label, 5.000 créditos IA.',
    monthly: 59900, // 599 €
    yearly: 479 * 12 * 100, // 479 €/mes × 12 = 5.748 €/año
    metadata: {
      networks: '30',
      posts_per_month: 'unlimited',
      ai_credits: '5000',
    },
  },
]

async function findOrCreateProduct(plan) {
  // Buscar existente por metadata.trendora_plan
  const existing = await stripe.products.search({
    query: `metadata['trendora_plan']:'${plan.key}' AND active:'true'`,
  })

  if (existing.data.length > 0) {
    console.log(`✓ Producto ${plan.key} ya existe: ${existing.data[0].id}`)
    return existing.data[0]
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { trendora_plan: plan.key, ...plan.metadata },
  })
  console.log(`✓ Creado producto ${plan.key}: ${product.id}`)
  return product
}

async function findOrCreatePrice(productId, planKey, period, amount) {
  const lookupKey = `trendora_${planKey}_${period}`
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  })

  if (existing.data.length > 0) {
    console.log(`  ✓ Precio ${period} ya existe: ${existing.data[0].id}`)
    return existing.data[0]
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'eur',
    recurring: {
      interval: period === 'monthly' ? 'month' : 'year',
    },
    lookup_key: lookupKey,
    nickname: `${planKey} ${period}`,
    metadata: { trendora_plan: planKey, trendora_period: period },
  })
  console.log(`  ✓ Creado precio ${period}: ${price.id} (${amount / 100} €)`)
  return price
}

async function main() {
  console.log('🚀 Configurando productos Trendora en Stripe (test mode)\n')

  const envLines = []

  for (const plan of PLANS) {
    const product = await findOrCreateProduct(plan)
    const monthly = await findOrCreatePrice(product.id, plan.key, 'monthly', plan.monthly)
    const yearly = await findOrCreatePrice(product.id, plan.key, 'yearly', plan.yearly)

    envLines.push(`STRIPE_PRICE_${plan.key.toUpperCase()}_MONTHLY=${monthly.id}`)
    envLines.push(`STRIPE_PRICE_${plan.key.toUpperCase()}_YEARLY=${yearly.id}`)
  }

  // Crear meter para AI credits si no existe
  console.log('\n📊 Creando meter de créditos IA…')
  try {
    const meters = await stripe.billing.meters.list({ limit: 100 })
    let meter = meters.data.find((m) => m.event_name === 'ai_credit_consumed')
    if (!meter) {
      meter = await stripe.billing.meters.create({
        display_name: 'AI Credits Consumed',
        event_name: 'ai_credit_consumed',
        default_aggregation: { formula: 'sum' },
        customer_mapping: { type: 'by_id', event_payload_key: 'stripe_customer_id' },
        value_settings: { event_payload_key: 'value' },
      })
      console.log(`✓ Creado meter: ${meter.id}`)
    } else {
      console.log(`✓ Meter ya existe: ${meter.id}`)
    }
    envLines.push(`STRIPE_METER_AI_CREDITS=${meter.id}`)
  } catch (e) {
    console.warn('⚠️  No se pudo crear meter (puede que tu cuenta no tenga el feature):', e.message)
  }

  console.log('\n✅ Listo. Añade estas líneas a tu .env:\n')
  console.log(envLines.join('\n'))
  console.log('\n')
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
