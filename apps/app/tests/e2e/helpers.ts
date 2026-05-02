/**
 * Helpers comunes para los tests E2E.
 *
 * Asumen acceso a Supabase via service_role para crear/limpiar usuarios.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '..', '..', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.SUPABASE_ANON_KEY!
const APP_URL = 'http://localhost:3000/app'

export const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

/**
 * Crea un usuario test, le inicia sesión vía magic link admin-generated, y
 * devuelve URL del callback con tokens listos para inyectar en el browser.
 */
export async function generateLoginUrl(email: string, next = '/dashboard'): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'magiclink',
      email,
      options: { redirect_to: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` },
    }),
  })
  if (!r.ok) throw new Error(`Failed to generate magic link: ${r.status}`)
  const j = (await r.json()) as { hashed_token: string }
  return (
    `${SUPABASE_URL}/auth/v1/verify?token=${j.hashed_token}&type=magiclink&redirect_to=` +
    encodeURIComponent(`${APP_URL}/auth/callback?next=${next}`)
  )
}

/**
 * Crea usuario + org + membership en Supabase, listos para login.
 * Devuelve identifiers para cleanup.
 */
export async function createTestUserWithOrg(opts: {
  emailPrefix: string
  orgName?: string
  orgVertical?: string
}): Promise<{ userId: string; orgId: string; orgSlug: string; email: string }> {
  const stamp = Date.now()
  const email = `${opts.emailPrefix}-${stamp}@trendora-e2e.test`
  const orgSlug = `${opts.emailPrefix}-${stamp}`
  const orgName = opts.orgName ?? `E2E ${opts.emailPrefix}`

  const { data: u, error: ue } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: 'e2e-test-password',
  })
  if (ue || !u.user) throw ue ?? new Error('user create failed')

  const { data: o, error: oe } = await admin
    .from('organizations')
    .insert({ name: orgName, slug: orgSlug, vertical: opts.orgVertical ?? 'restaurante' })
    .select('id')
    .single()
  if (oe || !o) throw oe ?? new Error('org create failed')

  await admin.from('memberships').insert({
    org_id: o.id,
    user_id: u.user.id,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  })

  await admin.from('brand_kits').insert({
    org_id: o.id,
    name: 'E2E Brand Kit',
    is_default: true,
    voice_prompt: 'Comunicación auténtica y cercana, datos concretos sobre superlativos vacíos.',
    tone: ['cercano', 'profesional'],
    do_not_say: ['barato', 'la mejor'],
  })

  return { userId: u.user.id, orgId: o.id, orgSlug, email }
}

export async function cleanupTestUser(userId: string, orgId: string) {
  // Cascade borra memberships, brand_kits, content_drafts, etc.
  await admin.from('organizations').delete().eq('id', orgId)
  await admin.auth.admin.deleteUser(userId)
}

export { APP_URL, ANON_KEY, SUPABASE_URL, SERVICE_KEY }
