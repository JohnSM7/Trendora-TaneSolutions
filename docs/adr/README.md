# Architecture Decision Records (ADRs)

Registro de decisiones arquitectónicas relevantes y su justificación.

| # | Título | Estado |
|---|---|---|
| [001](./001-monorepo-turborepo.md) | Monorepo con Turborepo + pnpm workspaces | Aceptado |
| [002](./002-marketing-astro-dashboard-nuxt.md) | Astro para marketing, Nuxt 4 para dashboard | Aceptado |
| [003](./003-supabase-multi-tenant.md) | Supabase con RLS para multi-tenancy | Aceptado |
| [004](./004-ayrshare-business.md) | Ayrshare Business como capa de publicación | Aceptado |
| [005](./005-inngest-jobs.md) | Inngest para jobs en background | Aceptado |
| [006](./006-vercel-ai-sdk.md) | Vercel AI SDK v5 para orquestación IA | Aceptado |
| [007](./007-stripe-billing-metered.md) | Stripe Billing con metered usage | Aceptado |

## Formato

Cada ADR sigue la plantilla:

```
# ADR XXX — Título

- **Estado**: Propuesto | Aceptado | Reemplazado por ADR YYY | Deprecado
- **Fecha**: AAAA-MM-DD
- **Autor**: nombre

## Contexto
Qué problema resolvemos y qué restricciones aplican.

## Opciones consideradas
A, B, C con pros/contras.

## Decisión
Qué elegimos y por qué.

## Consecuencias
Beneficios y costes asumidos.
```
