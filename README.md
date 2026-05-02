# Trendora

> Plataforma SaaS de **Tane Solutions** para automatizar la creación, gestión y publicación de contenido en redes sociales con inteligencia artificial.

[![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)]()
[![License](https://img.shields.io/badge/license-UNLICENSED-red)]()
[![Made by](https://img.shields.io/badge/by-Tane%20Solutions-5B5BD6)](https://tanesolutions.com)

---

## ¿Qué es?

Trendora permite a restaurantes, comercios locales y SaaS B2B publicar contenido constante y profesional en sus redes sociales con un esfuerzo mínimo. La IA genera copy + imagen, el cliente aprueba, la plataforma publica.

**Mantra**: *"Una hora al mes para tener tus redes activas todo el mes."*

---

## Documentación

| Documento | Para qué |
|---|---|
| [docs/PROYECTO.md](./docs/PROYECTO.md) | Visión, ICP, posicionamiento, métricas |
| [docs/PRICING.md](./docs/PRICING.md) | Planes, unit economics, A/B tests |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Plan de 0 a 100 por fases |
| [docs/BRAND.md](./docs/BRAND.md) | Identidad visual y voz de marca |
| [docs/SECURITY.md](./docs/SECURITY.md) | Modelo seguridad y GDPR |
| [docs/adr/](./docs/adr/) | Architecture Decision Records |

---

## Estructura del monorepo

```
tane-social-ai/
├── apps/
│   ├── web/              Astro 5 — marketing site (trendora.tanesolutions.com)
│   └── app/              Nuxt 4 — dashboard SaaS (app.trendora.tanesolutions.com)
├── packages/
│   ├── db/               Schema Supabase + cliente + tipos generados
│   ├── ui/               Componentes Vue compartidos (shadcn-vue)
│   ├── config/           Tailwind preset, tsconfig base
│   ├── ai/               Wrappers IA (Claude, Replicate) + prompts versionados
│   └── ayrshare/         Cliente Ayrshare Business API
├── docs/                 Documentación estratégica + ADRs
├── scripts/              Setup, checks
└── .github/workflows/    CI
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Marketing | Astro 5 + Vue islands + Tailwind |
| Dashboard | Nuxt 4 + Vue 3 + TypeScript + shadcn-vue |
| BD / Auth / Storage | Supabase (Postgres + RLS) |
| Pagos | Stripe Billing + Customer Portal |
| Background jobs | Inngest |
| AI orchestration | Vercel AI SDK v5 |
| AI texto | Claude 4.7 Sonnet |
| AI imagen | Nano Banana / Flux vía Replicate |
| Publicación social | Ayrshare Business (JWT multi-tenant) |
| Email | Resend |
| Hosting | Vercel + Supabase Cloud |
| Observabilidad | Sentry + PostHog |

---

## Inicio rápido

### Requisitos

- Node 22+
- pnpm 10+
- Supabase CLI (opcional, para BD local): `pnpm add -g supabase`
- Cuenta en: Supabase, Vercel, Stripe, Ayrshare, Resend, PostHog, Sentry, Inngest, Replicate, Anthropic

### Setup

```bash
# 1. Clonar
git clone <repo-url>
cd tane-social-ai

# 2. Setup automático
bash scripts/setup.sh

# 3. Editar .env con credenciales reales
$EDITOR .env

# 4. Verificar que todas las env vars críticas están
bash scripts/check-env.sh

# 5. (Opcional) BD local
cd packages/db
supabase start
supabase db reset    # aplica migraciones + seed
cd ../..

# 6. Generar tipos TS desde el schema actual
pnpm db:types

# 7. Arrancar todas las apps
pnpm dev
```

### URLs en desarrollo

| Servicio | URL |
|---|---|
| Marketing | http://localhost:4321 |
| Dashboard | http://localhost:3000 |
| Supabase Studio | http://localhost:54323 |
| Inngest Dev UI | http://localhost:8288 |

### Comandos útiles

```bash
pnpm dev               # todas las apps
pnpm dev:web           # solo marketing
pnpm dev:app           # solo dashboard
pnpm build             # build de todo
pnpm typecheck         # verifica tipos
pnpm lint              # lint
pnpm test              # tests
pnpm db:push           # push schema a Supabase remoto
pnpm db:types          # regenera types.gen.ts
pnpm format            # prettier sobre todo el repo
```

---

## Variables de entorno

Ver [`.env.example`](./.env.example). Las críticas:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`
- `AYRSHARE_API_KEY`, `AYRSHARE_PRIVATE_KEY`, `AYRSHARE_DOMAIN`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

---

## Despliegue

### Marketing (Astro) → Vercel

- Root directory: `apps/web`
- Build command: `pnpm build`
- Output: `dist`
- Env: `MARKETING_URL`, `PUBLIC_APP_URL`

### Dashboard (Nuxt) → Vercel

- Root directory: `apps/app`
- Build command: `pnpm build`
- Output: `.output`
- Env: todas las del `.env.example` (prod)

### DB → Supabase Cloud

```bash
cd packages/db
supabase link --project-ref <ref>
supabase db push
```

### Webhooks

- **Stripe**: añadir endpoint `https://trendora.tanesolutions.com/app/api/webhooks/stripe`
- **Ayrshare**: configurar en dashboard Ayrshare → `https://trendora.tanesolutions.com/app/api/webhooks/ayrshare`
- **Inngest**: registrar `https://trendora.tanesolutions.com/app/api/inngest`

---

## Contribución interna

- Branch principal: `main`
- Features: `feat/<descripción>`
- Fixes: `fix/<descripción>`
- Convenciones de commit: imperativo, español o inglés
- PR template: ver [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md)
- Cada PR pasa: typecheck + lint + tests + (si toca DB) RLS tests

---

## Licencia

Software propietario de Tane Solutions. Todos los derechos reservados.

---

## Contacto

- Web: https://tanesolutions.com
- Email: hola@tanesolutions.com
- LinkedIn: [Tane Solutions](https://linkedin.com/company/tane-solutions)
