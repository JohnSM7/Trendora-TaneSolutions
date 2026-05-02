import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts', 'packages/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.nuxt/**', '**/.output/**'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['packages/*/src/**'],
      exclude: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/__tests__/**'],
    },
  },
})
