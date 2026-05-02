/**
 * Tests RLS multi-tenant.
 *
 * Verifica que el aislamiento por org_id funciona realmente:
 *   - Usuario A no puede leer datos de la org de Usuario B
 *   - Usuario A no puede insertar en la org de Usuario B
 *   - Service role bypasea RLS (admin tasks)
 *
 * Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY en env.
 *
 * Skip automático si no hay env vars (CI sin secretos).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const skip = !url || !anonKey || !serviceKey
const describeIfDb = skip ? describe.skip : describe

describeIfDb('RLS multi-tenant', () => {
  let admin: SupabaseClient
  let userAClient: SupabaseClient
  let userBClient: SupabaseClient
  let userAId: string
  let userBId: string
  let orgAId: string
  let orgBId: string

  // Genera un email único para evitar colisiones entre runs
  const stamp = Date.now()
  const userAEmail = `rls-a-${stamp}@trendora.test`
  const userBEmail = `rls-b-${stamp}@trendora.test`

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, { auth: { persistSession: false } })

    // Crear 2 usuarios test
    const { data: a, error: ea } = await admin.auth.admin.createUser({
      email: userAEmail,
      password: 'rls-test-password-A',
      email_confirm: true,
    })
    if (ea) throw ea
    userAId = a.user.id

    const { data: b, error: eb } = await admin.auth.admin.createUser({
      email: userBEmail,
      password: 'rls-test-password-B',
      email_confirm: true,
    })
    if (eb) throw eb
    userBId = b.user.id

    // Crear 2 orgs (una para cada user) usando service role
    const orgASlug = `rls-a-${stamp}`
    const orgBSlug = `rls-b-${stamp}`

    const { data: oa, error: eoa } = await admin
      .from('organizations')
      .insert({ name: 'Org A', slug: orgASlug, vertical: 'restaurante' })
      .select('id')
      .single()
    if (eoa) throw eoa
    orgAId = oa.id

    const { data: ob, error: eob } = await admin
      .from('organizations')
      .insert({ name: 'Org B', slug: orgBSlug, vertical: 'restaurante' })
      .select('id')
      .single()
    if (eob) throw eob
    orgBId = ob.id

    // Asignar memberships
    await admin.from('memberships').insert([
      { org_id: orgAId, user_id: userAId, role: 'owner', accepted_at: new Date().toISOString() },
      { org_id: orgBId, user_id: userBId, role: 'owner', accepted_at: new Date().toISOString() },
    ])

    // Datos seed: brand kit en cada org
    await admin.from('brand_kits').insert([
      { org_id: orgAId, name: 'Kit A', is_default: true },
      { org_id: orgBId, name: 'Kit B', is_default: true },
    ])

    // Login con cada user para obtener clientes con su JWT
    const tmpA = createClient(url!, anonKey!, { auth: { persistSession: false } })
    const { data: sessionA, error: esA } = await tmpA.auth.signInWithPassword({
      email: userAEmail,
      password: 'rls-test-password-A',
    })
    if (esA) throw esA

    userAClient = createClient(url!, anonKey!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${sessionA.session?.access_token}` } },
    })

    const tmpB = createClient(url!, anonKey!, { auth: { persistSession: false } })
    const { data: sessionB, error: esB } = await tmpB.auth.signInWithPassword({
      email: userBEmail,
      password: 'rls-test-password-B',
    })
    if (esB) throw esB

    userBClient = createClient(url!, anonKey!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${sessionB.session?.access_token}` } },
    })
  }, 30_000)

  afterAll(async () => {
    if (!admin) return
    // Cleanup: borrar orgs (cascade) y users
    await admin.from('organizations').delete().in('id', [orgAId, orgBId])
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
  })

  it('Usuario A solo ve su propia org', async () => {
    const { data, error } = await userAClient
      .from('organizations')
      .select('id, name')
      .order('name')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.name).toBe('Org A')
  })

  it('Usuario B solo ve su propia org', async () => {
    const { data, error } = await userBClient
      .from('organizations')
      .select('id, name')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.name).toBe('Org B')
  })

  it('Usuario A no puede leer brand kits de Usuario B', async () => {
    const { data, error } = await userAClient
      .from('brand_kits')
      .select('id, name')

    expect(error).toBeNull()
    expect(data?.every((k) => k.name === 'Kit A')).toBe(true)
    expect(data?.some((k) => k.name === 'Kit B')).toBe(false)
  })

  it('Usuario A no puede leer brand kits de B aún consultando explícitamente por org_id de B', async () => {
    const { data, error } = await userAClient
      .from('brand_kits')
      .select('id, name')
      .eq('org_id', orgBId)

    expect(error).toBeNull()
    expect(data).toHaveLength(0) // RLS filtra antes que el WHERE
  })

  it('Usuario A no puede insertar en la org de Usuario B', async () => {
    const { error } = await userAClient
      .from('brand_kits')
      .insert({ org_id: orgBId, name: 'Kit Hostil', is_default: false })

    // Debe fallar — RLS bloquea el insert
    expect(error).not.toBeNull()
  })

  it('Usuario A no puede actualizar la org de Usuario B', async () => {
    const { data, error } = await userAClient
      .from('organizations')
      .update({ name: 'HACKED' })
      .eq('id', orgBId)
      .select()

    // Update sin error pero 0 filas afectadas (RLS filtró)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)

    // Verificar que Org B sigue intacta
    const { data: orgB } = await admin.from('organizations').select('name').eq('id', orgBId).single()
    expect(orgB?.name).toBe('Org B')
  })

  it('Usuario A no puede borrar la org de Usuario B', async () => {
    const { data, error } = await userAClient
      .from('organizations')
      .delete()
      .eq('id', orgBId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(0)

    // Verificar que sigue existiendo
    const { data: orgB } = await admin.from('organizations').select('id').eq('id', orgBId).single()
    expect(orgB).not.toBeNull()
  })

  it('Service role bypasea RLS (puede leer todo)', async () => {
    const { data, error } = await admin
      .from('organizations')
      .select('id')
      .in('id', [orgAId, orgBId])

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
  })

  it('Función public.user_orgs() devuelve solo las orgs del usuario actual', async () => {
    // Insertamos un draft con admin client en orgA y orgB
    await admin.from('content_drafts').insert([
      { org_id: orgAId, body: 'Draft A', platforms: ['instagram'] },
      { org_id: orgBId, body: 'Draft B', platforms: ['instagram'] },
    ])

    const { data: draftsA } = await userAClient.from('content_drafts').select('body')
    const { data: draftsB } = await userBClient.from('content_drafts').select('body')

    expect(draftsA?.map((d) => d.body)).toEqual(['Draft A'])
    expect(draftsB?.map((d) => d.body)).toEqual(['Draft B'])
  })
})
