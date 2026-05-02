import { test, expect } from '@playwright/test'
import { admin, generateLoginUrl, createTestUserWithOrg, cleanupTestUser } from './helpers'

test.describe('Billing — Settings page y checkout', () => {
  let userId: string
  let orgId: string
  let orgSlug: string
  let email: string

  test.beforeAll(async () => {
    const r = await createTestUserWithOrg({ emailPrefix: 'e2e-bill' })
    userId = r.userId
    orgId = r.orgId
    orgSlug = r.orgSlug
    email = r.email
  })

  test.afterAll(async () => {
    await cleanupTestUser(userId, orgId).catch(() => null)
  })

  test('settings/billing muestra plan trial actual', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/settings/billing`)
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(new RegExp(`/app/${orgSlug}/settings/billing`), {
      timeout: 15_000,
    })

    await expect(page.getByText('Plan actual')).toBeVisible()
    await expect(page.getByText('Prueba gratuita')).toBeVisible()
    await expect(page.getByText(/Te quedan.*días de prueba/)).toBeVisible()
  })

  test('muestra los 3 tiers (Starter, Pro, Agency) con precios', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/settings/billing`)
    await page.goto(verifyUrl)

    await expect(page.getByText('Starter').first()).toBeVisible()
    await expect(page.getByText('99 €')).toBeVisible()
    await expect(page.getByText('249 €')).toBeVisible()
    await expect(page.getByText('599 €')).toBeVisible()
  })

  test('checkout crea sesión Stripe (test mode)', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, `/${orgSlug}/settings/billing`)
    await page.goto(verifyUrl)

    // Click "Cambiar a Pro" o equivalente
    const changeButton = page.getByRole('button', { name: /Cambiar a Pro/ }).first()
    if (await changeButton.isVisible().catch(() => false)) {
      // Interceptar la navegación a Stripe Checkout
      const navPromise = page.waitForRequest(
        (req) => req.url().includes('checkout.stripe.com') || req.url().includes('stripe.com'),
        { timeout: 15_000 },
      )
      await changeButton.click()
      const req = await navPromise.catch(() => null)
      // No hace falta que lleguemos a Stripe — solo verificar que se generó el redirect
      expect(req?.url() ?? '').toMatch(/stripe/)
    }
  })
})
