# Roadmap — Trendora

> Plan de ejecución de 0 a 100 organizado en fases con entregables verificables.

## Leyenda
- 🟦 Fase de construcción
- 🟢 Fase de operación
- ✅ Completado | 🚧 En curso | ⏳ Pendiente

---

## 🟦 Fase 0 — Validación y setup (semanas 1-2)

**Objetivo**: confirmar mercado y arrancar con bases sólidas.

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 0.1 | 8 entrevistas con potenciales clientes (5 hostelería + 3 SaaS) | ⏳ | Doc Notion con quotes |
| 0.2 | Definir nicho de salida y mensaje | ⏳ | One-pager |
| 0.3 | Reservar dominios + DNS | ⏳ | `app.trendora.tanesolutions.com`, `trendora.tanesolutions.com` |
| 0.4 | Crear cuentas SaaS | ⏳ | Supabase, Vercel, Stripe (test), Ayrshare trial, Resend, Sentry, PostHog, Inngest |
| 0.5 | Repo monorepo Turborepo | ✅ | Esta tarea |
| 0.6 | CI GitHub Actions (lint + typecheck + test) | 🚧 | Workflow base creado |
| 0.7 | Brand identity producto | ⏳ | Logo, paleta, tipografía, Figma |

**Salida**: 3+ clientes potenciales dispuestos a pagar; repo y entornos cloud creados.

---

## 🟦 Fase 1 — Cimientos técnicos (semanas 3-4)

**Objetivo**: auth, multi-tenancy, conexión Ayrshare end-to-end.

| # | Tarea | Estado |
|---|---|---|
| 1.1 | Schema Supabase + migraciones SQL | 🚧 |
| 1.2 | RLS policies + tests Vitest | ⏳ |
| 1.3 | Setup Nuxt 4 + módulos esenciales | 🚧 |
| 1.4 | Flujo signup → crear org → crear Ayrshare profile | ⏳ |
| 1.5 | Página "Conecta tus redes" con JWT Ayrshare | ⏳ |
| 1.6 | Webhook receiver Ayrshare | ⏳ |
| 1.7 | Layouts + temas dark/light | ⏳ |
| 1.8 | Middleware multi-tenant | ⏳ |

**Salida**: usuario nuevo puede registrarse, crear org y conectar IG+FB+LinkedIn en <5 min.

---

## 🟦 Fase 2 — Generación con IA (semanas 5-6)

**Objetivo**: generar copy + imagen + previsualizar.

| # | Tarea | Estado |
|---|---|---|
| 2.1 | Pantalla Brand Kit (logos, voz, paletas) | ⏳ |
| 2.2 | Endpoint `/api/ai/generate-post` con streaming | ⏳ |
| 2.3 | Endpoint `/api/ai/generate-image` (Replicate) | ⏳ |
| 2.4 | Endpoint `/api/ai/repurpose` | ⏳ |
| 2.5 | UI Studio: chat IA + preview por plataforma | ⏳ |
| 2.6 | Generador hashtags + mejor hora | ⏳ |
| 2.7 | Persistencia `generations` + metering | ⏳ |

**Salida**: usuario genera 7 posts (texto+imagen) en <3 min.

---

## 🟦 Fase 3 — Calendario, aprobación y publicación (semanas 7-8)

| # | Tarea | Estado |
|---|---|---|
| 3.1 | Calendario drag-drop FullCalendar Vue | ⏳ |
| 3.2 | Workflow aprobación link público con token | ⏳ |
| 3.3 | Inngest job `post.scheduled` con retry | ⏳ |
| 3.4 | Manejo errores + notificaciones | ⏳ |
| 3.5 | Sync métricas cada 6h | ⏳ |
| 3.6 | Dashboard analítico | ⏳ |
| 3.7 | Bulk schedule CSV | ⏳ |

**Salida**: 100% posts programados publican o fallan con retry y notificación.

---

## 🟦 Fase 4 — Pagos, planes y onboarding (semanas 9-10)

| # | Tarea | Estado |
|---|---|---|
| 4.1 | Productos y precios Stripe | ⏳ |
| 4.2 | Metered usage IA credits | ⏳ |
| 4.3 | Customer Portal | ⏳ |
| 4.4 | Webhooks Stripe idempotentes | ⏳ |
| 4.5 | Paywall por feature | ⏳ |
| 4.6 | Onboarding interactivo 5 pasos | ⏳ |
| 4.7 | Invitación de miembros con roles | ⏳ |
| 4.8 | Trial 14d + email lifecycle | ⏳ |

**Salida**: 5 conversiones trial→paid en pruebas internas.

---

## 🟦 Fase 5 — Beta privada (semanas 11-12)

| # | Tarea | Estado |
|---|---|---|
| 5.1 | Landing Astro con waitlist y demo Loom | ⏳ |
| 5.2 | Reclutar 5 hostelería + 5 SaaS (descuento -50% lifetime) | ⏳ |
| 5.3 | Slack/Discord cerrado | ⏳ |
| 5.4 | Sentry + PostHog session replays | ⏳ |
| 5.5 | Iteración semanal top 3 fricciones | ⏳ |
| 5.6 | E2E Playwright 5 flujos críticos | ⏳ |
| 5.7 | Auditoría seguridad (RLS, secrets, OWASP) | ⏳ |

**Salida**: NPS ≥ 40, churn = 0, 5 clientes pagando.

---

## 🟦 Fase 6 — Lanzamiento público (semanas 13-14)

| # | Tarea | Estado |
|---|---|---|
| 6.1 | Product Hunt launch | ⏳ |
| 6.2 | 5 case studies con métricas | ⏳ |
| 6.3 | 50+ landings programmatic SEO | ⏳ |
| 6.4 | Contenido orgánico LinkedIn 3/sem | ⏳ |
| 6.5 | Programa afiliados (Rewardful) | ⏳ |
| 6.6 | Documentación pública + tutoriales | ⏳ |
| 6.7 | Status page | ⏳ |

**Salida**: 30 cuentas pago, MRR 4.500 €.

---

## 🟢 Fase 7 — Crecimiento (mes 4-6)

| # | Iniciativa | Estado |
|---|---|---|
| 7.1 | Plan Agency white-label avanzado | ⏳ |
| 7.2 | Integraciones Notion / Canva / WordPress / Shopify | ⏳ |
| 7.3 | Tane Brain (agente proactivo) | ⏳ |
| 7.4 | Vertical SaaS B2B | ⏳ |
| 7.5 | App móvil Capacitor | ⏳ |
| 7.6 | Vídeo IA (Veo 3 + HeyGen) | ⏳ |
| 7.7 | Migración progresiva a APIs nativas | ⏳ |

**Salida**: 100 cuentas, MRR 18 K, churn < 5%.

---

## 🟢 Fase 8 — Escala (mes 7-12)

- Plan Enterprise (1.500-3.000 €/mes con SSO, SLA, contratos anuales)
- Expansión geográfica (Portugal, LATAM)
- Equipo 4-5 personas
- Round seed (opcional, si el camino bootstrapped lo justifica)
- Partnerships con asociaciones de hostelería
- API pública + marketplace de plantillas

**Objetivo**: MRR 50 K, ARR 600 K.
