import { test, expect } from '@playwright/test'
import { admin, createTestUserWithOrg, cleanupTestUser } from './helpers'
import { randomBytes } from 'node:crypto'

test.describe('Aprobación pública — link con token', () => {
  let userId: string
  let orgId: string
  let orgSlug: string
  let draftId: string
  let token: string

  test.beforeAll(async () => {
    const r = await createTestUserWithOrg({ emailPrefix: 'e2e-app' })
    userId = r.userId
    orgId = r.orgId
    orgSlug = r.orgSlug

    // Crear un draft con bodies + token de aprobación
    token = randomBytes(24).toString('base64url')
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const scheduled = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await admin
      .from('content_drafts')
      .insert({
        org_id: orgId,
        title: 'E2E Test Post',
        body: 'Contenido principal del post de prueba',
        bodies_per_platform: {
          instagram: 'IG: pizza margherita 🍕',
          facebook: 'FB: ven a probar nuestra pizza margherita',
          linkedin: 'LinkedIn: tradición italiana en cada bocado',
        },
        platforms: ['instagram', 'facebook', 'linkedin'],
        hashtags: ['Pizza', 'Margherita'],
        status: 'in_review',
        approval_token: token,
        approval_token_expires_at: expires,
        scheduled_at: scheduled,
      })
      .select('id')
      .single()

    if (error || !data) throw error
    draftId = data.id
  })

  test.afterAll(async () => {
    await cleanupTestUser(userId, orgId).catch(() => null)
  })

  test('página pública renderiza sin login', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto(`/app/approve/${token}`)
    await expect(page.getByText('Aprobación de contenido')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /E2E e2e-app/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Aprobar y programar/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pedir cambios/ })).toBeVisible()
  })

  test('aprobar cambia status a scheduled y borra token', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto(`/app/approve/${token}`)
    await page.getByRole('button', { name: /Aprobar y programar/ }).click()
    await expect(page.getByRole('heading', { name: '¡Aprobado!' })).toBeVisible({
      timeout: 10_000,
    })

    // Verificar en BD
    const { data: draft } = await admin
      .from('content_drafts')
      .select('status, approval_token')
      .eq('id', draftId)
      .single()
    expect(draft?.status).toBe('scheduled')
    expect(draft?.approval_token).toBeNull()

    const { data: approval } = await admin
      .from('approvals')
      .select('decision')
      .eq('draft_id', draftId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    expect(approval?.decision).toBe('approved')
  })

  test('token inválido devuelve error 404', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/app/approve/token-invalido-no-existe')
    await expect(page.getByText(/Enlace inválido/i)).toBeVisible({ timeout: 10_000 })
  })

  test('token expirado devuelve error', async ({ page, context }) => {
    // Crear draft con token ya expirado
    const expiredToken = randomBytes(24).toString('base64url')
    await admin.from('content_drafts').insert({
      org_id: orgId,
      body: 'Expired draft',
      platforms: ['instagram'],
      status: 'in_review',
      approval_token: expiredToken,
      approval_token_expires_at: new Date(Date.now() - 1000).toISOString(),
    })

    await context.clearCookies()
    await page.goto(`/app/approve/${expiredToken}`)
    await expect(page.getByText(/expirado/i)).toBeVisible({ timeout: 10_000 })
  })
})
