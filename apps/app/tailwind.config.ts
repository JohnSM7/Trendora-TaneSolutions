import type { Config } from 'tailwindcss'
import preset from '@tane/config/tailwind'

export default {
  presets: [preset],
  content: [
    './app/**/*.{vue,ts}',
    './server/**/*.ts',
    './nuxt.config.ts',
    '../../packages/ui/src/**/*.{vue,ts}',
  ],
} satisfies Config
