import { test, expect } from '@playwright/test'
import { admin, generateLoginUrl, createTestUserWithOrg, cleanupTestUser } from './helpers'

test.describe('Studio IA — Generar post', () => {
  let userId: string
  let orgId: string
  let orgSlug: string
  let email: string

  test.beforeAll(async () => {
    const r = await createTestUserWithOrg({ emailPrefix: 'e2e-gen' })
    userId = r.userId
    orgId = r.orgId
    orgSlug = r.orgSlug
    email = r.email
  })

  test.afterAll(async () => {
    await cleanupTestUser(userId, orgId).catch(() => null)
  })

  test('el Studio carga con brand kit seleccionado y plataformas por defecto', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/studio`)
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(new RegExp(`/app/${orgSlug}/studio`), { timeout: 15_000 })

    await expect(page.getByRole('heading', { name: 'Studio IA' })).toBeVisible()
    await expect(page.locator('#topic')).toBeVisible()
    // Plataformas por defecto: Instagram, Facebook, LinkedIn
    const igButton = page.getByRole('button', { name: 'Instagram' })
    await expect(igButton).toBeVisible()
  })

  test('genera post con OpenAI y muestra preview por plataforma', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/studio`)
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(new RegExp(`/app/${orgSlug}/studio`), { timeout: 15_000 })

    await page
      .locator('#topic')
      .fill('Anuncio del menú de domingo: pizza margherita + ensalada de la huerta')

    await page.getByRole('button', { name: 'Generar posts' }).click()

    // Esperar a que aparezca el preview (puede tardar 5-15s con OpenAI)
    await expect(page.getByText(/Última generación:.*créditos/i)).toBeVisible({ timeout: 60_000 })

    // Tabs Instagram/Facebook/LinkedIn deben estar visibles
    await expect(page.getByRole('tab', { name: 'Instagram' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Facebook' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'LinkedIn' })).toBeVisible()

    // Botón Guardar como borrador debe aparecer
    await expect(page.getByRole('button', { name: /Guardar como borrador/ })).toBeEnabled()
  })

  test('guarda como borrador y queda en BD con status draft', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/studio`)
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(new RegExp(`/app/${orgSlug}/studio`), { timeout: 15_000 })

    await page.locator('#topic').fill('Promo de mediodía: 2x1 en pizzas para grupos')
    await page.getByRole('button', { name: 'Generar posts' }).click()
    await expect(page.getByText(/Última generación:.*créditos/i)).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: /Guardar como borrador/ }).click()
    await expect(page.getByText(/Guardado como borrador/i)).toBeVisible({ timeout: 5_000 })

    // Verificar en BD
    const { data } = await admin
      .from('content_drafts')
      .select('id, status, body, platforms')
      .eq('org_id', orgId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(data).toHaveLength(1)
    expect(data![0]!.platforms).toContain('instagram')
    expect((data![0]!.body as string).length).toBeGreaterThan(20)
  })
})
