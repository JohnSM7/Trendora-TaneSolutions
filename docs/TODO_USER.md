# 📋 Lo que tienes que hacer tú (Trendora — siguiente fase)

> Lista priorizada de tareas que **requieren intervención humana** porque implican abrir cuentas, configurar DNS, copiar secretos del dashboard, etc. Yo no puedo hacerlas desde aquí.

Lo que ya hice yo: ver `ROADMAP.md` y `DEPLOY.md`. Estado del proyecto: **MVP funcional E2E en local con OpenAI + Supabase + Stripe productos**.

---

## 🔴 BLOQUEANTES MVP

Sin estos 4 puntos no se puede ofrecer Trendora a nadie real.

### 1. Cuenta Inngest (5 min, FREE tier)
Para que las publicaciones programadas se ejecuten automáticamente.

1. Ve a https://app.inngest.com/sign-up — crea cuenta con `hola@tanesolutions.com`
2. **Crear App**: nombre `trendora-prod`
3. **Settings → Event Keys** → copia el `INNGEST_EVENT_KEY` (empieza por `evt_`)
4. **Settings → Signing Key** → copia el `INNGEST_SIGNING_KEY` (empieza por `signkey-prod-`)
5. Pega ambos en `.env` reemplazando los placeholders
6. Cuando despleguemos: en **Apps → Sync URL** pones `https://trendora.tanesolutions.com/app/api/inngest`

> ⚠️ **Sobre el Inngest CLI dev local** (`pnpm inngest:dev` en :8288): hay un problema de protocolo entre `inngest-cli@1.19.1` y `inngest@3.54.0` SDK donde el CLI invoca el SDK con GET en vez de POST y la función nunca se ejecuta. Esto **NO afecta producción** porque Inngest Cloud usa un protocolo de invocación distinto. Para test E2E local de scheduling, lo más rápido es publicar directamente con la API Ayrshare (`curl POST https://api.ayrshare.com/api/post`) o usar Playwright contra la UI. El bug del CLI dev se resuelve actualizando coordinadamente CLI + SDK; lo dejamos para más adelante porque no es bloqueante.

### 2. Cuenta Ayrshare — Modo A (FREE) elegido para validación

> **Decisión tomada**: vamos con Modo A (Free + onboarding asistido) hasta llegar a 5+ clientes pagando. El código detecta automáticamente el modo según las env vars — no hay que tocar código para migrar a Business luego.
>
> Lee `docs/CLIENT_ONBOARDING.md` para el flujo completo de cómo dar de alta clientes en este modo (te toma ~15 min/cliente vía videollamada).

#### Setup tuyo (una vez, ahora)

1. Ya tienes la API key (✅ `AYRSHARE_API_KEY` configurada)
2. Ve a [app.ayrshare.com → Social Accounts](https://app.ayrshare.com/social-accounts) y conecta **tus propias redes** primero (IG, FB, LinkedIn, X) para probar el flujo. Cuando llegue un cliente, conectarás las suyas en la **misma cuenta Ayrshare** (sí, todas comparten la misma cuenta primaria — eso es lo que limita el plan Free, pero es válido para validar el negocio).
3. Deja **vacíos** estos en `.env`:
   ```
   AYRSHARE_PRIVATE_KEY=
   AYRSHARE_DOMAIN=
   ```
4. **Webhook (opcional pero recomendado para producción)**:
   - Ve a https://app.ayrshare.com/api → sección **Webhooks**
   - URL: `https://trendora.tanesolutions.com/app/api/webhooks/ayrshare` (cuando deploys; en dev no hace falta porque Inngest hace polling)
   - **Actions a seleccionar**:
     - ✅ `feed` — recibimos confirmación cuando un post se publica/falla
     - ✅ `social` — recibimos eventos de conexión/desconexión de cuentas
     - ⬜ `comments` / `messages` — solo si quieres responder DMs desde Trendora (futuro)
   - Si te pide secret: genera uno aleatorio (ej: `openssl rand -hex 32`) y guárdalo en `AYRSHARE_WEBHOOK_SECRET`

#### Cómo funciona el onboarding de cada cliente nuevo (Modo A)

Cuando un cliente quiera conectar sus redes:
1. Va a `Settings → Redes sociales` en Trendora y clica **"✉️ Solicitar conexión"** o **"📅 Agendar llamada"**
2. Te llega email a `hola@tanesolutions.com` con asunto pre-rellenado
3. Tú agendas 15 min, compartes pantalla y guías al cliente para que conecte sus redes desde [app.ayrshare.com/social-accounts](https://app.ayrshare.com/social-accounts) (login con tu cuenta `hola@tanesolutions.com`, el cliente teclea sus credenciales — nunca tú)
4. Cliente vuelve a Trendora → `Settings` → "↻ Actualizar" → ve sus redes con check verde

📖 **Pasos detallados, plantillas de email, trampas comunes (Instagram Business, TikTok dominio) y SLA en `docs/CLIENT_ONBOARDING.md`**

#### Cuándo migrar a Modo B — Business (599 $/mes)

**Triggers**:
- ≥5 clientes pagando ≥99€/mes (cubre los $599 con margen)
- O cualquier cliente Agency 599€/mes (paga la cuenta él solo)

**Migración** (1 día de trabajo):
1. Upgrade Ayrshare → Business
2. **Settings → API → JWT Authentication** → "Generate Key Pair"
3. Copia la **Private Key** completa (incluye `-----BEGIN RSA PRIVATE KEY-----` y `-----END...`) a `.env` como `AYRSHARE_PRIVATE_KEY`
4. Copia el `domain` (algo como `trendora-tanesolutions`) a `AYRSHARE_DOMAIN`
5. Para cada cliente existente: crea profile en Ayrshare con `POST /profiles` y guarda `profileKey` en `organizations.ayrshare_profile_key`
6. Email a clientes: "Te estamos migrando a un sistema mejor donde tú gestionas tus redes". Reconectan una vez vía OAuth white-label.

El código ya está preparado — detecta `AYRSHARE_PRIVATE_KEY` automáticamente y cambia el comportamiento. **No hay que tocar código en la migración**.

### 3. Stripe webhook secret + events (5 min)
Para que cuando alguien pague, la BD actualice el plan automáticamente.

#### Para test local con Stripe CLI:
```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/app/api/webhooks/stripe
```
Te dará un `whsec_...` temporal en consola. Pégalo en `.env` como `STRIPE_WEBHOOK_SECRET`.

> Con `stripe listen` se reenvían **todos los eventos** automáticamente — no hay que seleccionarlos. Solo es para producción.

#### Para producción (después del deploy):
1. https://dashboard.stripe.com/webhooks → **Add endpoint**
2. URL: `https://trendora.tanesolutions.com/app/api/webhooks/stripe`
3. **Events to listen** — marca exactamente estos 7:

   **Suscripción (alta, cambios, baja)**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`  ← aviso D-3 antes del cobro

   **Checkout (cuando alguien completa el pago en Stripe Checkout)**
   - ✅ `checkout.session.completed`

   **Facturación (renovaciones mensuales/anuales)**
   - ✅ `invoice.payment_succeeded` ← reset usage_meter del periodo
   - ✅ `invoice.payment_failed` ← alertar al cliente para que arregle el método de pago

4. **API version**: deja "latest" (Stripe usa la versión de tu cuenta)
5. Copia el **Signing secret** (`whsec_...`) → guárdalo en Vercel env var `STRIPE_WEBHOOK_SECRET`

> El handler ya está preparado para los 7 eventos: maneja idempotencia, mapea price_id → plan automáticamente leyendo de tus env vars (`STRIPE_PRICE_STARTER_MONTHLY`, etc.) y registra todo en `stripe_events` y `audit_log`.

> Si más adelante quieres añadir features (pausas, refunds, métricas adicionales), eventos extra útiles:
> - `invoice.upcoming` — pre-aviso de próxima factura (7 días antes)
> - `customer.subscription.paused` / `resumed` — si activas pausas
> - `charge.dispute.created` — si alguien hace chargeback

### 4. Resend dominio verificado (10 min, requiere DNS)
Para enviar emails desde `noreply@trendora.tanesolutions.com` en lugar de `onboarding@resend.dev`.

1. https://resend.com/domains → **Add Domain**
2. Añade `tanesolutions.com`
3. Resend te da varios records DNS (SPF, DKIM, DMARC). Añádelos en tu DNS (Cloudflare o el que uses)
4. Espera la verificación (5-30 min)
5. En `.env` (y en Vercel) cambia:
   ```
   RESEND_FROM_EMAIL="Trendora <noreply@trendora.tanesolutions.com>"
   ```

---

## 🟡 ANTES DE LANZAR

### 5. Subir a GitHub
```bash
cd C:/Users/johns/OneDrive/Documentos/GitHub/SaaS-RRSS
git init
git add .
git commit -m "Initial commit: Trendora MVP funcional"
gh repo create rankusx/trendora --private --source=. --remote=origin --push
```

### 6. Deploy a Vercel
Sigue **`docs/DEPLOY.md`** paso a paso. En resumen:
- Crear proyecto **`trendora-app`** apuntando a `apps/app`
- Crear proyecto **`trendora-web`** apuntando a `apps/web`
- Conectar dominio `trendora.tanesolutions.com` al proyecto `trendora-web`
- Copiar todas las env vars de `.env` al dashboard de Vercel (en `trendora-app`)
- Verificar el rewrite `/app → trendora-app.vercel.app`

### 7. Actualizar Supabase Auth para producción
**Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: `https://trendora.tanesolutions.com/app`
- **Redirect URLs** (añadir):
  ```
  https://trendora.tanesolutions.com/app
  https://trendora.tanesolutions.com/app/**
  https://trendora.tanesolutions.com/app/auth/callback
  ```

### 8. PostHog (opcional, FREE 1M events/mes)
Para analytics de producto.
1. https://eu.posthog.com/signup
2. **Project Settings → API Keys** → copia `POSTHOG_API_KEY` (empieza por `phc_`)
3. Pégalo en Vercel env var

### 9. Sentry (opcional, FREE 5K errors/mes)
Para error tracking.
1. https://sentry.io/signup
2. **Create Project** → Vue
3. Copia el `SENTRY_DSN` (URL completa)
4. Pégalo en Vercel env var

---

## 🟢 POST-LAUNCH (mes 1-3)

- 50+ landings programmatic SEO (tenemos 8)
- Status page (Better Stack o Instatus)
- Programa afiliados (Rewardful)
- 5 case studies con clientes beta
- Product Hunt launch

---

## ✅ Lo que YA está listo (sin que tengas que tocarlo)

- ✅ Marketing site Astro completo (home, precios, blog, verticales, legal, contacto, casos)
- ✅ Dashboard Nuxt 4 (login, onboarding, Studio IA, Calendar, Brand Kits, Analytics, Borradores, Settings, Equipo, Billing)
- ✅ 12 tablas Supabase con RLS multi-tenant blindado (9/9 tests RLS pasan)
- ✅ Tipos TS reales generados desde el schema
- ✅ OpenAI integrado (texto + imagen DALL-E → Supabase Storage)
- ✅ Stripe productos creados (3 planes × 2 periodicidades + meter IA)
- ✅ Theme switcher dark/light global
- ✅ Tests E2E Playwright (5 flujos: login, onboarding, generar post, aprobación pública, billing)
- ✅ Tests unitarios Vitest (pricing, prompts, schemas, Ayrshare, emails)
- ✅ Email lifecycle (welcome, trial-ending, approval-requested, post-published, post-failed, weekly-report)
- ✅ Headers CSP estrictos en producción (vercel.json)
- ✅ Plugin Sentry + PostHog opcionales (se activan al rellenar env vars)
- ✅ DEPLOY.md con guía paso a paso
- ✅ Documentación estratégica (PROYECTO, PRICING, ROADMAP, BRAND, SECURITY, ADRs)

---

## 📞 Cuando termines lo bloqueante, dime y arrancamos:

1. **Beta privada**: 5 restaurantes + 5 SaaS de tu red, descuento -50% lifetime
2. **Lanzamiento Product Hunt**: caso de estudio, demo Loom, hunters preparados
3. **Vertical 2 (SaaS B2B)** en mes 4

Lista de cuentas requeridas en orden de prioridad:
| # | Cuenta | Tiempo | Coste |
|---|---|---|---|
| 1 | Inngest | 5 min | FREE |
| 2 | Ayrshare | 10 min | FREE → $599/mes (Business) |
| 3 | Stripe webhook | 5 min | FREE |
| 4 | Resend domain | 10 min DNS | FREE → $20/mes (Pro) |
| 5 | Vercel | 10 min | FREE → $20/mes (Pro) |
| 6 | PostHog | 5 min | FREE 1M ev/mes |
| 7 | Sentry | 5 min | FREE 5K err/mes |

**Total tiempo tuyo**: ~50 min de configuración. **Total coste fijo mes 1**: 0 € (todo en free tier).
