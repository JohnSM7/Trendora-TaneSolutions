# ADR 005 — Inngest para jobs en background

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Necesitamos ejecutar trabajos en background:
- Publicación programada de posts (cron por minuto)
- Sincronización de métricas cada 6h
- Generación IA de imagen/vídeo (puede tardar 30s-3min)
- Envío de emails lifecycle
- Webhooks Stripe/Ayrshare (procesar idempotente)
- Retries con backoff exponencial cuando una plataforma social falla

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Inngest** | Steps, retries, fan-out, cron, observabilidad UI, gratis hasta 50K runs/mes, fluent SDK TS | Vendor lock-in suave |
| Trigger.dev v3 | Similar a Inngest, open source | Setup más complejo |
| pg_cron + Edge Functions Supabase | Stack ya en uso | Sin retries decentes, sin UI, observabilidad pobre |
| BullMQ + Redis (Upstash) | Control total | Requiere worker dedicado, más infra |
| Vercel Cron + queue manual | Mínima dependencia | Reescribir lo que ya hace Inngest |
| Temporal | Industrial-grade | Overkill para fase inicial |

## Decisión

**Inngest** desde el día 1.

### Eventos clave que definiremos

```typescript
// publicación
'post.scheduled' → step.sleepUntil → call Ayrshare → step.run('save')
'post.publish.failed' → retry x3 con backoff → notificar a usuario
'post.metrics.fetch' → fan-out por cada cuenta social

// IA
'ai.generate.requested' → step.run con timeout 3min → store result
'ai.image.generate' → llamar Replicate → polling hasta completar

// billing
'stripe.webhook.received' → verificar firma → idempotencia por event.id

// lifecycle
'user.signup' → wait 0/3/7/12/14 días → send email
'org.trial.ended' → degradar plan o mantener si pagó
```

## Consecuencias

✅ Retries y observabilidad gratis
✅ Tests locales con `inngest-cli dev`
✅ Migración futura a Trigger.dev posible (modelo similar)
⚠️ Otra dependencia más en el stack
⚠️ Free tier: 50K runs/mes basta hasta ~50 clientes activos; subir a paid ($20/mes) cuando crezcamos
