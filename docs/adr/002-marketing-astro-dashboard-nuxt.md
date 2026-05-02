# ADR 002 — Astro para marketing, Nuxt 4 para dashboard

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Necesitamos dos productos web con perfiles de carga muy distintos:
- **Marketing site**: contenido estático, SEO crítico, blog, programmatic landings, conversión a signup. Pocas interacciones, mucho contenido.
- **Dashboard SaaS**: app autenticada con calendario drag-drop, editor IA con streaming, real-time, charts, multi-tenant. Mucha interacción, estado complejo.

Stack ya conocido por el equipo: Vue 3 (CLAUDE.md global lo prioriza).

## Opciones consideradas

### Para marketing
| Opción | Pros | Contras |
|---|---|---|
| **Astro 5** | SSG/SSR híbrido, islands, SEO máximo, blog Markdown, programmatic páginas con `getStaticPaths()` | Vue como island (no SPA real) |
| Nuxt 4 SSR | Mismo framework dashboard | Menos optimizado para sites content-heavy, JS innecesario |
| Next.js | Maduro | Cambiar stack a React |

### Para dashboard
| Opción | Pros | Contras |
|---|---|---|
| **Nuxt 4** | Vue 3 + Nitro server, file-based routing, layouts persistentes, auto-imports, módulos Supabase oficiales | Ecosistema menor que Next |
| Astro con `client:load` everywhere | Reusa stack | Pierde su ventaja en apps reactivas |
| Next.js + React | Mayor ecosistema, AI SDK de Vercel | Cambiar lenguaje de componentes |
| SvelteKit | Bundles pequeños | No conocemos Svelte |

## Decisión

**Astro 5 para marketing + Nuxt 4 para dashboard.**

Ambos comparten:
- Vue 3 (Astro como island, Nuxt como base)
- Tailwind CSS
- TypeScript estricto
- Componentes UI desde `@tane/ui` (shadcn-vue)

## Consecuencias

✅ SEO óptimo en marketing (Lighthouse 95+, JS mínimo)
✅ DX correcta en dashboard (composables, server routes Nitro)
✅ Reutilización de componentes Vue entre ambos
✅ Despliegue independiente en Vercel (dos proyectos del monorepo)
⚠️ Dos sistemas de routing distintos (asumido)
⚠️ Auth compartida vía Supabase JWT cookie en dominio raíz `tane.solutions`
