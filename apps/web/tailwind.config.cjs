const preset = require('@tane/config/tailwind').default

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/ui/src/**/*.{vue,ts}',
  ],
  plugins: [require('@tailwindcss/typography'), ...(preset.plugins ?? [])],
}
