# ADR 007 — Stripe Billing con metered usage

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Cobramos suscripciones mensuales/anuales de tres tiers (Starter/Pro/Agency) + créditos IA adicionales en packs. Los clientes deben poder gestionar su suscripción sin contactar soporte.

## Decisión

**Stripe Billing** con:

1. **3 productos** (Starter, Pro, Agency), cada uno con 2 prices (mensual, anual con -20%).
2. **Customer Portal** habilitado para upgrade/downgrade/cancelación self-service.
3. **Stripe Meter** (`ai_credits_used`) que recibe eventos `credit.consumed` con `value=N` cuando se gasta. Stripe factura el exceso sobre el incluido en el plan.
4. **Webhooks** con idempotencia por `event.id` guardado en tabla `stripe_events`.
5. **Trial 14 días sin tarjeta** vía `subscription.trial_period_days = 14`.
6. **Tax automático** con Stripe Tax habilitado (España RGPD friendly, factura en EUR).

### Eventos Stripe que escuchamos

| Evento | Acción |
|---|---|
| `customer.subscription.created` | Marcar org como `plan_active` con tier y `current_period_end` |
| `customer.subscription.updated` | Actualizar tier o `cancel_at_period_end` |
| `customer.subscription.deleted` | Degradar a `plan=free` (read-only) |
| `invoice.payment_failed` | Alerta + email cliente, retry Smart Retries de Stripe |
| `invoice.payment_succeeded` | Reset uso del periodo en `usage_meter` |
| `customer.subscription.trial_will_end` | Email D-3 al fin de trial |

### Tabla auxiliar

```sql
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,           -- event.id Stripe
  type TEXT NOT NULL,
  org_id UUID,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Consecuencias

✅ Cumplimiento facturación europea (Stripe Tax + factura PDF automática)
✅ Reducción carga soporte (Customer Portal cubre 90% solicitudes)
✅ Margen IA protegido con metered billing
⚠️ Comisión Stripe ~1.5% + €0.25/transacción (asumido en pricing)
⚠️ Test mode obligatorio en CI antes de tocar producción
