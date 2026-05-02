import { test, expect } from '@playwright/test'
import { admin, generateLoginUrl, cleanupTestUser } from './helpers'

test.describe('Auth — Login flow', () => {
  let userId: string
  const email = `e2e-login-${Date.now()}@trendora-e2e.test`

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
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => null)
  })

  test('landing de login renderiza correctamente', async ({ page }) => {
    await page.goto('/app/auth/login')
    await expect(page.getByRole('heading', { name: 'Entra en tu cuenta' })).toBeVisible()
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviarme el enlace' })).toBeEnabled()
  })

  test('botón es clickable aunque el campo esté vacío', async ({ page }) => {
    await page.goto('/app/auth/login')
    const button = page.getByRole('button', { name: 'Enviarme el enlace' })
    await expect(button).toBeEnabled()
  })

  test('enviar magic link muestra mensaje de confirmación', async ({ page }) => {
    await page.goto('/app/auth/login')
    await page.getByPlaceholder('tu@email.com').fill(email)
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('Revisa tu bandeja de entrada')).toBeVisible({ timeout: 15_000 })
  })

  test('usar magic link generado vía admin completa el login', async ({ page }) => {
    const verifyUrl = await generateLoginUrl(email, '/dashboard')
    await page.goto(verifyUrl)
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15_000 })
    await expect(page.getByText(`Hola ${email}`)).toBeVisible()
  })

  test('rutas privadas redirigen a login si no hay sesión', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/\/app\/auth\/login/, { timeout: 10_000 })
  })
})
