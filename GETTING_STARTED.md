# Getting Started — Trendora

Guía paso a paso para arrancar el proyecto desde cero. Sigue el orden.

---

## 1. Crear cuentas externas (30 min)

Antes de tocar código, abre cuentas en:

| Servicio | Para qué | Coste fase 0 |
|---|---|---|
| [Supabase](https://supabase.com) | DB, auth, storage | Free tier |
| [Vercel](https://vercel.com) | Hosting | Hobby gratis |
| [Anthropic](https://console.anthropic.com) | Claude API | $5 crédito inicial |
| [Replicate](https://replicate.com) | Imagen IA | Pay-per-use |
| [Ayrshare](https://app.ayrshare.com) | Publicación social | Free tier (5 perfiles) |
| [Stripe](https://dashboard.stripe.com) | Pagos | Free (test mode) |
| [Resend](https://resend.com) | Email | 3.000/mes gratis |
| [Inngest](https://app.inngest.com) | Jobs | Free 50K runs/mes |
| [PostHog](https://eu.posthog.com) | Analytics | Free 1M events/mes |
| [Sentry](https://sentry.io) | Errores | Free 5K errors/mes |

Apunta las API keys en 1Password / Bitwarden.

---

## 2. Setup local (10 min)

```bash
git clone <repo-url> tane-social-ai
cd tane-social-ai

bash scripts/setup.sh

# Edita .env con las credenciales del paso 1
nano .env

bash scripts/check-env.sh
```

---

## 3. Configurar Supabase (15 min)

### Opción A: Local (recomendado para desarrollo)

```bash
pnpm add -g supabase
cd packages/db
supabase start          # arranca Docker con Postgres + Studio
supabase db reset       # aplica migraciones + seed
```

Studio en http://localhost:54323. Anota las keys que imprime `supabase start` y mételas en `.env` (apartado `SUPABASE_*`).

### Opción B: Remoto

```bash
cd packages/db
supabase link --project-ref <tu-project-ref>
supabase db push
```

### Crear primer usuario

En Studio → Auth → Users → "Add user" con email `demo@tane.solutions`. Luego ejecuta el seed:

```bash
supabase db reset    # local
# o
supabase db execute --file supabase/seed.sql    # remoto
```

---

## 4. Configurar Ayrshare (15 min)

1. Abre [app.ayrshare.com](https://app.ayrshare.com) → API
2. Plan free para empezar (5 perfiles). Pasar a Business cuando tengamos beta.
3. Copia la **API Key** → `AYRSHARE_API_KEY`
4. Genera **JWT keys** (Settings → API → Generate Key Pair):
   - Pega la Private Key como `AYRSHARE_PRIVATE_KEY` en `.env`
   - El Domain: `tane-social` → `AYRSHARE_DOMAIN`
5. Configurar webhook (cuando tengas dominio):
   - URL: `https://trendora.tanesolutions.com/app/api/webhooks/ayrshare`
   - Eventos: `social.connected`, `post.published`, `post.failed`, `analytics.updated`

---

## 5. Configurar Stripe (20 min)

1. Modo **test** primero
2. Crear productos en Dashboard → Products:
   - **Tane Starter** con precios mensual (99 €) y anual (948 €)
   - **Tane Pro** con precios mensual (249 €) y anual (2.388 €)
   - **Tane Agency** con precios mensual (599 €) y anual (5.748 €)
3. Crear un Meter:
   - Display name: "AI Credits Used"
   - Event name: `credit.consumed`
4. Copiar todos los `price_*` IDs y meter ID al `.env`
5. Webhook (cuando tengas dominio):
   - URL: `https://trendora.tanesolutions.com/app/api/webhooks/stripe`
   - Eventos: `customer.subscription.*`, `invoice.payment_failed`, `invoice.payment_succeeded`
6. Activar **Stripe Tax** y **Customer Portal** en Settings

---

## 6. Arrancar el dev server (5 min)

```bash
pnpm dev
```

Abre:
- http://localhost:4321 — landing
- http://localhost:3000 — dashboard (te llevará a /auth/login)
- http://localhost:54323 — Supabase Studio

Inicia sesión con `demo@tane.solutions` (te llegará un magic link).

---

## 7. Smoke test end-to-end (15 min)

1. **Login**: enviar magic link → recibir email → click → entrar al dashboard
2. **Crear org** desde `/onboarding` (si no se creó por seed)
3. **Conectar red social**: Settings → Social → Connect Instagram → completar OAuth en Ayrshare
4. **Crear brand kit** con voz y colores
5. **Generar primer post** desde Studio
6. **Programar** para 2 minutos en el futuro
7. **Verificar** que se publica correctamente

Si todo lo anterior funciona, la base está sólida.

---

## 8. Siguiente paso: tu primera feature

Lee [docs/ROADMAP.md](./docs/ROADMAP.md) y elige la siguiente tarea pendiente. Recomendado:

- **Fase 2.1**: pantalla Brand Kit (UI completa con upload de logo, paletas)
- **Fase 2.2**: endpoint `/api/ai/generate-post` con Vercel AI SDK streaming
- **Fase 2.5**: UI Studio con preview por plataforma

---

## Troubleshooting

### `pnpm install` falla

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Supabase no arranca

```bash
supabase stop --no-backup
docker system prune
supabase start
```

### Tipos TS desactualizados

```bash
pnpm db:types
```

### Nuxt no encuentra módulos `@tane/*`

```bash
pnpm install   # asegura el linking de workspace
cd apps/app
pnpm exec nuxt prepare
```

---

## Recursos

- [Nuxt 4 docs](https://nuxt.com/docs/4.x)
- [Astro 5 docs](https://docs.astro.build)
- [Supabase docs](https://supabase.com/docs)
- [Vercel AI SDK](https://ai-sdk.dev)
- [Ayrshare API](https://www.ayrshare.com/docs)
- [Stripe Billing](https://stripe.com/docs/billing)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Inngest](https://www.inngest.com/docs)
