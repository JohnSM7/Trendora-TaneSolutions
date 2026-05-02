import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config para tests E2E del dashboard Trendora.
 *
 * Asume dev server corriendo en localhost:3000/app (lanzado fuera) o lo levanta.
 * En CI usar `--reporter=github` para mejores anotaciones.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests comparten datos en Supabase remoto
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm --filter @tane/app dev',
        url: 'http://localhost:3000/app/auth/login',
        reuseExistingServer: true,
        timeout: 120_000,
        cwd: '../..',
      },
})
