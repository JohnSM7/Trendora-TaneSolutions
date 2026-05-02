# Trendora — Documento maestro del proyecto

> Producto SaaS de **Tane Solutions** para automatizar la creación, gestión y publicación de contenido en redes sociales mediante IA.

---

## 1. Visión

Convertir a Tane Solutions en el partner tecnológico de referencia para **negocios locales (hostelería) y SaaS B2B** que quieran tener presencia profesional y constante en redes sociales sin contratar un community manager full-time.

**Mantra**: *"Una hora al mes para tener tus redes activas todo el mes."*

---

## 2. Posicionamiento

### Mercado objetivo (ICP)

**Vertical 1 (salida) — Hostelería y negocios locales**
- Restaurantes, bares, cafeterías, gimnasios, clínicas dentales, peluquerías, tiendas físicas
- 1-20 empleados, sin departamento de marketing
- Pain: saben que deben publicar pero no tienen tiempo ni ideas
- Pagan: 100-400 €/mes hoy a freelancers irregulares
- Canal de adquisición: red existente Tane + bundle con `web-restaurante`

**Vertical 2 (expansión, mes 4+) — SaaS B2B y founders**
- SaaS pre-seed a Series A, founders solos o equipos pequeños
- Pain: tienen contenido (blog, podcast, demos) pero no lo aprovechan en redes
- Pagan: 200-800 €/mes hoy a agencias o herramientas + freelancer
- Canal: LinkedIn outbound + Product Hunt + SEO

### Diferenciadores

1. **Brand Kit IA vertical-específico**: prompts, plantillas y assets afinados para cada nicho. No es un Buffer genérico.
2. **Bundle único hostelería**: web (`web-restaurante`) + redes sociales automáticas en una sola suscripción. Imposible de igualar para competidores SaaS puros.
3. **IA proactiva (Tane Brain, fase 7)**: agente que aprende del histórico del cliente y sugiere posts antes de que los pidan.
4. **Equipo bilingüe nativo ES/CA + soporte humano real** vs herramientas USA con copy traducido.

### Posicionamiento vs competencia

| Competidor | Precio | Debilidad que explotamos |
|---|---|---|
| Buffer | $5-15/mes | IA débil, genérico, sin verticales |
| Hootsuite | $99-249/mes | Caro, complejo, abandonó freemium |
| Metricool | Free-€18/mes | Foco en analítica, débil en generación IA |
| Later | $25-200/mes | Solo Instagram-first |
| FeedHive / Predis.ai | $19-99/mes | Calidad copy regular, sin verticales |
| Agencias locales | 400-1500 €/mes | Caras, lentas, sin tecnología |

**Nuestro sweet spot**: 99-599 €/mes con calidad de agencia y velocidad de SaaS.

---

## 3. Voz de marca

- **Tono**: cercano, confiado, profesional. Nada de "rockstar / ninja / hack". Hablamos como un buen partner de negocio.
- **Idiomas**: español (mercado primario), catalán (Barcelona/Valencia), inglés (mes 6+).
- **Reglas**:
  - Tutear siempre.
  - Datos concretos > superlativos.
  - Mostrar producto real > prometer transformación vital.
  - Nunca decir "automatizamos todo" — decimos "automatizamos lo repetitivo, vosotros aprobáis lo importante".

### Palabras prohibidas
- "Revoluciona", "transforma tu vida", "viraliza", "10x", "growth hacking", "ninja", "rockstar".

### Palabras que sí
- "Ahorrar tiempo", "control", "consistencia", "calidad profesional", "tu marca, tu voz".

---

## 4. Producto

### Funcionalidades MVP (semana 14)

1. **Onboarding** (5 min): registro → crear organización → conectar IG/FB/LinkedIn/TikTok/X vía Ayrshare JWT
2. **Brand Kit**: logos, paletas, fuentes, voz, palabras prohibidas → genera system prompt persistente
3. **Studio IA**: chat con Claude que genera 1-7 posts adaptados por plataforma con preview real
4. **Generación de imagen**: Nano Banana / Flux con style transfer al brand kit
5. **Calendario drag-and-drop**: vista mes/semana/día, reagendar arrastrando
6. **Aprobación cliente**: link público con token, comentarios, aprobar/rechazar
7. **Publicación automática**: cron + retry vía Inngest + Ayrshare
8. **Analytics**: métricas por post, comparativa, KPIs por plataforma
9. **Equipo**: invitar miembros con roles (owner/admin/editor/viewer)
10. **Billing**: Stripe Subscriptions + Customer Portal + créditos IA metered

### Funcionalidades fase 7 (mes 4-6)

- Tane Brain (agente proactivo)
- Vídeo IA (Veo 3 + HeyGen)
- White-label avanzado para agencias
- Integraciones Notion / Canva / WordPress / Shopify
- App móvil (Capacitor)
- Repurposing automático (blog → hilo X + carrusel IG + vídeo Reel)

---

## 5. Métricas clave

### Norte (un solo número)
**MRR** (Monthly Recurring Revenue)

### Métricas por fase

**Fase activación (semana 0-4 del cliente)**
- Time to first post < 30 min desde signup
- Conexión de ≥3 redes sociales en primer login
- Primer post programado en día 1

**Fase retención (mes 1-3 del cliente)**
- Posts publicados / mes ≥ plan mínimo del tier
- DAU/MAU > 30%
- NPS ≥ 40

**Fase negocio**
- CAC payback < 3 meses
- LTV/CAC > 3x
- Churn mensual < 5%
- MRR mes 3: 4.500 €
- MRR mes 6: 18.000 €
- MRR mes 12: 50.000 €

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Ayrshare sube precios o cierra | Media | Alto | Abstraer en interfaz `SocialPublisher`; tener Postiz self-hosted como plan B |
| Coste IA descontrolado | Alta | Medio | Prompt caching agresivo + límites por plan + alertas de gasto |
| Plataforma social cambia API | Alta | Bajo (Ayrshare absorbe) | Confiar en SLA Ayrshare; monitorizar webhooks |
| Aparece competidor agresivo | Media | Medio | Foco vertical hostelería + bundle Tane (no replicable) |
| Burnout del founder | Media | Crítico | Límites de horario, automatizar soporte con Crisp+IA |
| GDPR/RGPD compliance | Baja | Alto | Auditoría legal antes de launch público; DPA con todos los proveedores |

---

## 7. Stack tecnológico (resumen)

Ver [docs/adr/](./adr/) para los Architecture Decision Records detallados.

```
┌─────────────────────────────────────────────────┐
│ Marketing  Astro 5 + Vue islands + Tailwind     │
│ Dashboard  Nuxt 4 + Vue 3 + TS + shadcn-vue     │
│ DB/Auth    Supabase (Postgres + RLS + Storage)  │
│ Pagos      Stripe Billing + Customer Portal     │
│ Jobs       Inngest                              │
│ AI orch    Vercel AI SDK v5                     │
│ AI texto   Claude 4.7 Sonnet                    │
│ AI imagen  Nano Banana / Flux vía Replicate     │
│ Social     Ayrshare Business (JWT multi-tenant) │
│ Email      Resend                               │
│ Hosting    Vercel + Supabase Cloud              │
│ Obs        Sentry + PostHog                     │
└─────────────────────────────────────────────────┘
```

---

## 8. Equipo y roles

- **Founder técnico (Tane)**: producto, ingeniería, decisión final
- **(Futuro mes 3)**: Customer success part-time
- **(Futuro mes 6)**: Marketing/content full-time

---

## 9. Documentos relacionados

- [PRICING.md](./PRICING.md) — Estrategia de pricing y planes
- [ROADMAP.md](./ROADMAP.md) — Roadmap detallado por fases
- [adr/](./adr/) — Architecture Decision Records
- [BRAND.md](./BRAND.md) — Guía de marca y assets
- [SECURITY.md](./SECURITY.md) — Modelo de seguridad y compliance
