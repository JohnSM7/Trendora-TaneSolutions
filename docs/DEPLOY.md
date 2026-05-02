# Deploy a Vercel — Trendora

Guía paso a paso para desplegar Trendora en producción con dominio `trendora.tanesolutions.com`.

> Modelo A: marketing y app comparten subdominio. Marketing en raíz, app bajo `/app`.

---

## 0. Prerrequisitos

- Cuenta Vercel con plan Pro (o Hobby si solo es para testing)
- Dominio `tanesolutions.com` con DNS controlado por ti (Cloudflare, Route 53, lo que sea)
- Repo subido a GitHub (necesario para auto-deploy en push)
- Todas las env vars de `.env` accesibles para copiar al dashboard de Vercel

---

## 1. Subir el repo a GitHub

Si no lo has hecho ya:

```bash
cd C:/Users/johns/OneDrive/Documentos/GitHub/SaaS-RRSS
git init
git add .
git commit -m "Initial commit: Trendora MVP funcional"
gh repo create rankusx/trendora --private --source=. --remote=origin --push
```

---

## 2. Crear los DOS proyectos Vercel

**Importante**: en Modelo A son **dos proyectos Vercel** que comparten dominio mediante rewrite.

### Proyecto A — `trendora-app` (Nuxt dashboard)

```
Project name:        trendora-app
Framework preset:    Nuxt.js
Root directory:      apps/app
Build command:       (vacío — usa el de vercel.json)
Output directory:    .output
Install command:     pnpm install --frozen-lockfile
Node.js version:     22.x
```

**Variables de entorno** (copiar todas las server-side de tu `.env`):
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY (opcional)
GOOGLE_AI_API_KEY (opcional)
REPLICATE_API_TOKEN (opcional)
AYRSHARE_API_KEY
AYRSHARE_PRIVATE_KEY
AYRSHARE_DOMAIN
AYRSHARE_WEBHOOK_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET (importante: el de PRODUCCIÓN, ver paso 7)
STRIPE_PRICE_STARTER_MONTHLY
STRIPE_PRICE_STARTER_YEARLY
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_AGENCY_MONTHLY
STRIPE_PRICE_AGENCY_YEARLY
STRIPE_METER_AI_CREDITS
RESEND_API_KEY
RESEND_FROM_EMAIL
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
SENTRY_DSN (opcional)
SENTRY_AUTH_TOKEN (opcional)
POSTHOG_API_KEY (opcional)
POSTHOG_HOST
NUXT_SESSION_PASSWORD
```

Y públicas (NUXT_PUBLIC_*):
```
NUXT_PUBLIC_APP_URL=https://trendora.tanesolutions.com/app
NUXT_PUBLIC_MARKETING_URL=https://trendora.tanesolutions.com
```

**Deploy URL temporal**: `https://trendora-app.vercel.app` (necesaria para el rewrite de marketing).

### Proyecto B — `trendora-web` (Astro marketing)

```
Project name:        trendora-web
Framework preset:    Astro
Root directory:      apps/web
Build command:       pnpm build
Output directory:    dist
Install command:     pnpm install --frozen-lockfile
Node.js version:     22.x
```

**Variables de entorno**:
```
PUBLIC_APP_URL=https://trendora.tanesolutions.com/app
MARKETING_URL=https://trendora.tanesolutions.com
```

---

## 3. Conectar dominio `trendora.tanesolutions.com` al proyecto `trendora-web`

1. **Vercel → Project trendora-web → Settings → Domains**
2. Add: `trendora.tanesolutions.com`
3. Vercel te pedirá un registro CNAME o A. Configura en tu DNS:
   ```
   CNAME  trendora  cname.vercel-dns.com.
   ```
   (o A record con la IP que te indiquen)
4. Espera la verificación (5-30 min)

---

## 4. Configurar el rewrite `/app/*` en marketing

Ya está en `apps/web/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/app", "destination": "https://trendora-app.vercel.app/app" },
    { "source": "/app/:path*", "destination": "https://trendora-app.vercel.app/app/:path*" }
  ]
}
```

Solo asegúrate de que la URL en `destination` coincida con la URL real del proyecto Vercel `trendora-app`. Si Vercel le asignó otro nombre tipo `trendora-app-rankusx.vercel.app`, edita ese campo.

---

## 5. Actualizar URLs en Supabase Auth

**Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://trendora.tanesolutions.com/app`
- **Redirect URLs** (añadir todas):
  ```
  https://trendora.tanesolutions.com/app
  https://trendora.tanesolutions.com/app/**
  https://trendora.tanesolutions.com/app/auth/callback
  http://localhost:3000/app
  http://localhost:3000/app/**
  http://localhost:3000/app/auth/callback
  ```

---

## 6. Configurar Stripe webhook

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. **URL**: `https://trendora.tanesolutions.com/app/api/webhooks/stripe`
3. **Events to listen**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia el **Signing secret** (`whsec_...`) y mételo en Vercel env var `STRIPE_WEBHOOK_SECRET`
5. Redeploy `trendora-app` para que tome el nuevo secret

---

## 7. Configurar Ayrshare webhook (cuando la integres)

1. **app.ayrshare.com → Settings → Webhooks → Add**
2. **URL**: `https://trendora.tanesolutions.com/app/api/webhooks/ayrshare`
3. Genera un secret aleatorio y guárdalo en `AYRSHARE_WEBHOOK_SECRET` (Vercel env var)

---

## 8. Configurar Inngest

1. **app.inngest.com → Apps → Add new app → Sync URL**
2. **URL**: `https://trendora.tanesolutions.com/app/api/inngest`
3. Inngest detectará automáticamente las funciones registradas
4. Copia `INNGEST_EVENT_KEY` y `INNGEST_SIGNING_KEY` desde Inngest dashboard a Vercel env vars

---

## 9. Configurar Resend

1. **resend.com → Domains → Add Domain**
2. Añade `tanesolutions.com` y verifica DNS records (SPF, DKIM, DMARC)
3. Una vez verificado, cambia en Vercel env var:
   ```
   RESEND_FROM_EMAIL="Trendora <noreply@trendora.tanesolutions.com>"
   ```
4. Redeploy

---

## 10. Smoke test post-deploy

```bash
# Marketing
curl -I https://trendora.tanesolutions.com/
curl -I https://trendora.tanesolutions.com/precios

# App (rewriteado)
curl -I https://trendora.tanesolutions.com/app/auth/login

# Headers seguridad
curl -I https://trendora.tanesolutions.com/ | grep -i "content-security\|strict-transport"
```

Visita https://trendora.tanesolutions.com y verifica:
- [ ] Marketing carga
- [ ] /precios funciona
- [ ] /app/auth/login carga (vía rewrite)
- [ ] Login con magic link redirige correctamente
- [ ] Headers CSP están aplicados (DevTools → Network → Response Headers)

---

## 11. CI/CD automático

Una vez creado el proyecto, Vercel auto-deploya en cada push a `main`. Para PRs, crea preview deployments automáticamente.

Si quieres staging separado, conecta una rama `staging` en cada proyecto Vercel.

---

## Troubleshooting

### "404 NOT_FOUND" al ir a /app
- El rewrite no está activo. Verifica `apps/web/vercel.json` y redeploy `trendora-web`.

### "Invalid Origin" al hacer login
- El callback URL no está en allowlist de Supabase Auth.
- Verifica paso 5.

### Webhooks Stripe dan 400
- El `STRIPE_WEBHOOK_SECRET` es del entorno de **test**, no de **producción**. Genera uno nuevo en el endpoint de production.

### Imágenes IA no se ven
- CSP bloquea `data:` URLs si no se incluye `data:` en `img-src`. Ya está añadido en nuestro CSP.
- Si la URL viene de otro dominio (Replicate, OpenAI), añadirlo a `img-src`.
