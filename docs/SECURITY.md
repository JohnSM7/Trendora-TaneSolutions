# Security & Compliance — Trendora

## Modelo de aislamiento multi-tenant

**Una sola instancia, múltiples organizaciones, aislamiento por `org_id` con RLS.**

- Toda tabla con datos de cliente tiene columna `org_id UUID NOT NULL`.
- Política RLS estándar: `org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())`.
- El frontend nunca filtra por `org_id` manualmente — lo hace Postgres.
- Tests automatizados verifican aislamiento (intento de leer org ajena con JWT distinto debe devolver 0 filas).

## Secretos

- **NUNCA** en frontend.
- Variables sensibles: solo en `runtimeConfig` de Nuxt (server-only).
- Rotación trimestral de API keys.
- Vault: 1Password para humanos, Vercel/Supabase env vars para producción.
- Pre-commit hook con `git-secrets` o `gitleaks`.

## OAuth y autenticación

- **Auth de usuarios**: Supabase Auth (email + magic link + Google OAuth).
- **Auth de redes sociales**: delegado a Ayrshare (JWT 30 min hacia su flujo OAuth).
- **Auth API entre apps**: Bearer JWT firmado por Supabase.
- **Webhooks Stripe/Ayrshare**: verificación de firma obligatoria.

## GDPR / RGPD

Datos personales tratados:
- Email, nombre, foto perfil del usuario admin
- Tokens OAuth de redes sociales (gestionados por Ayrshare como sub-procesador)
- Métricas agregadas de cuentas sociales

Obligaciones cumplidas:
- [ ] Aviso legal y política privacidad publicados antes de launch público
- [ ] DPA firmado con Supabase, Ayrshare, Stripe, Resend, Sentry, PostHog
- [ ] Endpoint `DELETE /me` que borra usuario + organizaciones donde es único miembro
- [ ] Export `GET /me/export` con todos los datos en JSON
- [ ] Cookie banner (Vue) con consent management
- [ ] Logs sin PII excepto `org_id` y `user_id`
- [ ] Retención: datos eliminados 30 días tras cancelación

## OWASP Top 10 — controles

| Riesgo | Control |
|---|---|
| A01 Broken Access Control | RLS en todas las tablas, tests de aislamiento |
| A02 Cryptographic Failures | TLS 1.3 obligatorio, secretos cifrados en reposo |
| A03 Injection | Solo prepared statements (Supabase client), Zod en bordes |
| A04 Insecure Design | Threat modeling antes de cada feature crítica |
| A05 Security Misconfiguration | CSP estricto, headers seguridad, default-deny |
| A06 Vulnerable Components | Dependabot + audit semanal |
| A07 Auth Failures | Supabase Auth + rate limit signin endpoint |
| A08 Software/Data Integrity | Verificación firma webhooks, lockfile en repo |
| A09 Logging Failures | Sentry para errores, audit log para acciones sensibles |
| A10 SSRF | Whitelist de dominios para fetch de URLs cliente |

## CSP y headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.posthog.com; img-src 'self' data: https://*.supabase.co https://*.ayrshare.com; connect-src 'self' https://*.supabase.co https://api.ayrshare.com https://api.anthropic.com https://api.stripe.com https://*.posthog.com https://*.sentry.io
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Audit log

Tabla `audit_log` registra:
- `org_id`, `user_id`, `action`, `target_type`, `target_id`, `metadata`, `ip`, `ua`, `at`

Acciones registradas: login, conexión social, cambio plan, eliminación contenido, cambio rol miembro, exportación datos.

## Plan de respuesta a incidentes

1. Detección (Sentry alert / cliente reporte)
2. Triaje severidad (P1: data leak / down; P2: feature roto; P3: cosmético)
3. Comunicación: `status.trendora.tanesolutions.com` + email a afectados <2h en P1
4. Mitigación + rollback si aplica
5. Postmortem público en 7 días para P1
6. Notificación AEPD en <72h si breach de datos personales
