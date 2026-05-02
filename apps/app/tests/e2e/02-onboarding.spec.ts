import { test, expect } from '@playwright/test'
import { admin, generateLoginUrl } from './helpers'

test.describe('Onboarding — Crear primera org', () => {
  let userId: string
  const email = `e2e-onb-${Date.now()}@trendora-e2e.test`
  const orgSlug = `e2e-onb-${Date.now()}`
  let orgId: string | null = null

  test.beforeAll(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: 'e2e-test',
    })
    if (error || !data.user) throw error
    userId = data.user.id
  })

  test.afterAll(async () => {
    if (orgId) await admin.from('organizations').delete().eq('id', orgId).catch(() => null)
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => null)
  })

  test('login y luego crear org desde onboarding', async ({ page }) => {
    // Login
    const verifyUrl = await generateLoginUrl(email, '/dashboard')
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15_000 })

    // Click "Crear nueva organización"
    await page.getByRole('link', { name: /Crear nueva organización/ }).click()
    await expect(page).toHaveURL(/\/app\/onboarding/)

    // Rellenar form
    await page.locator('#name').fill('E2E Test Org')
    await expect(page.locator('#slug')).toHaveValue(/e2e-test-org/)

    // Sobreescribir slug con el único de este test
    await page.locator('#slug').fill(orgSlug)

    // Vertical ya está restaurante por defecto
    await page.getByRole('button', { name: 'Crear organización' }).click()

    // Debería redirigir al dashboard de la org
    await expect(page).toHaveURL(new RegExp(`/app/${orgSlug}`), { timeout: 15_000 })

    // Capturar orgId para cleanup
    const { data } = await admin.from('organizations').select('id').eq('slug', orgSlug).single()
    orgId = data?.id ?? null
    expect(orgId).toBeTruthy()

    // Sidebar debe mostrar Studio IA, Calendar, etc.
    await expect(page.getByRole('link', { name: 'Studio IA' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendario' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Brand Kit' })).toBeVisible()
  })

  test('brand kit por defecto se crea automáticamente con voz vertical', async () => {
    const { data: kits } = await admin
      .from('brand_kits')
      .select('name, voice_prompt, tone, is_default')
      .eq('org_id', orgId!)

    expect(kits).toHaveLength(1)
    expect(kits![0]!.is_default).toBe(true)
    expect(kits![0]!.voice_prompt).toBeTruthy()
    expect(kits![0]!.voice_prompt).toContain('restaurante')
  })

  test('slug duplicado da error 409', async ({ page }) => {
    // Login con MISMO usuario
    const verifyUrl = await generateLoginUrl(email, '/onboarding')
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 15_000 })

    await page.locator('#name').fill('E2E Org Dup')
    await page.locator('#slug').fill(orgSlug) // mismo slug
    await page.getByRole('button', { name: 'Crear organización' }).click()

    await expect(page.getByText(/Ya existe.*slug/i)).toBeVisible({ timeout: 10_000 })
  })
})
