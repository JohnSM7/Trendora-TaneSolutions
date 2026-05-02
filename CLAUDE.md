# CLAUDE.md — Trendora

Contexto específico del proyecto para asistencia con Claude Code. Las instrucciones globales del usuario también aplican.

## Resumen del proyecto

**Trendora** es una plataforma SaaS multi-tenant que automatiza la creación, gestión y publicación de contenido en redes sociales con IA. Producto bajo paraguas **Tane Solutions**.

Verticales objetivo: **hostelería** (salida) y **SaaS B2B** (expansión).

Lee primero:
- [docs/PROYECTO.md](./docs/PROYECTO.md) — visión y posicionamiento
- [docs/ROADMAP.md](./docs/ROADMAP.md) — qué se está construyendo y por qué
- [docs/adr/](./docs/adr/) — decisiones técnicas con justificación

## Stack y convenciones

- **Monorepo**: Turborepo + pnpm workspaces
- **Marketing**: Astro 5 + Vue islands en `apps/web`
- **Dashboard**: Nuxt 4 + Vue 3 + TS en `apps/app`
- **DB**: Supabase Postgres con RLS por `org_id`
- **IA**: Vercel AI SDK (Claude 4.7 + Replicate)
- **Social**: Ayrshare Business API (multi-tenant via Profile Keys + JWT)
- **Pagos**: Stripe Billing con metered usage
- **Jobs**: Inngest

## Reglas de negocio

1. **Multi-tenancy estricto**: toda tabla con datos de cliente lleva `org_id` y RLS. NUNCA filtrar por `org_id` en frontend — confía en la BD.
2. **Service role key**: solo en webhooks y jobs Inngest. Nunca en respuesta a request de usuario sin re-validar permisos.
3. **Costing IA**: cada llamada se persiste en `generations` con `cost_usd`. Convertir a créditos con `costToCredits()` y descontar de `usage_meter`.
4. **Prompt caching obligatorio** en system prompts >1024 tokens. Reduce coste 70%.
5. **Ayrshare es la única vía de publicación social**. No llamamos APIs nativas directamente.
6. **Idempotencia en webhooks**: guardar `event.id` en `stripe_events` antes de procesar.

## Estilo de código

- Vue 3 Composition API + `<script setup lang="ts">`
- Componentes: `PascalCase.vue`
- Páginas Astro: `kebab-case.astro`
- Funciones / variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Imports relativos solo dentro del mismo paquete; entre paquetes usar `@tane/*`
- Zod para validación en bordes (request bodies, env vars)
- Errores tipados, no `throw new Error('...')` genérico en handlers públicos

## Cuando trabajes en una feature

1. Lee el ADR relevante (si existe) o pregúntate si necesitas uno nuevo
2. Verifica si ya hay código similar (`Grep` antes de escribir)
3. Si tocas schema → migración numerada en `packages/db/supabase/migrations/`
4. Si tocas RLS → tests obligatorios verificando aislamiento entre orgs
5. Si tocas IA → versiona el prompt y considera prompt caching
6. Si tocas billing → solo en Stripe test mode, nunca producción

## Anti-patrones que evitar

- ❌ Llamar a Supabase con service role en código de UI
- ❌ Hardcodear `price_xxx` IDs (usar env vars)
- ❌ Olvidar `await` en una llamada Ayrshare (silent failure)
- ❌ Crear endpoint sin validación Zod del body
- ❌ Generar IA sin registrar `generations` (rompe metering)
- ❌ Polling de webhooks (siempre push + idempotencia)

## Comandos frecuentes

```bash
pnpm dev                # todo el monorepo
pnpm dev:app            # solo dashboard
pnpm dev:web            # solo marketing
pnpm db:types           # regenera tipos TS desde schema
pnpm typecheck          # verifica tipos en todo el repo
cd packages/db && supabase db reset  # reset BD local
```

## Para nuevas pantallas / endpoints

Plantilla mental:

1. Schema (si aplica) → tipos generados → store/composable → endpoint server → componente UI
2. Cada uno con tests cuando toque lógica de negocio
3. PR pequeña, una responsabilidad clara

## Si algo va mal

- BD: leer logs en Supabase Studio → SQL Editor
- IA: leer `generations` para ver últimos prompts/outputs
- Publicación: leer `audit_log` filtrando por `action LIKE 'webhook.ayrshare.%'`
- Pagos: Stripe Dashboard → Events
