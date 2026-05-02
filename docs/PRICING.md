# Pricing — Trendora

## Filosofía

- **Price anchoring**: tres tiers para que Pro parezca el "razonable" (efecto Goldilocks).
- **Annual discount agresivo (-20%)** para mejorar cash flow desde mes 1.
- **Metered AI credits**: el plan incluye un pool generoso pero quien abuse paga packs adicionales. Protege margen sin asustar al cliente medio.
- **No freemium**: trial 14 días sin tarjeta es suficiente. Free atrae perfil tóxico que satura soporte.
- **Anclaje vs agencia**: en cada landing comparamos con "lo que cuesta una agencia tradicional" (800-1500 €/mes).

---

## Planes

### 🌱 Starter — 99 €/mes (79 €/mes anual)

Para autónomos y micro-negocios que empiezan.

- 3 redes sociales conectadas
- 60 posts publicados / mes
- 200 créditos IA / mes (≈40 generaciones de post completo con imagen)
- 1 brand kit
- 1 usuario
- Calendario y aprobación
- Analytics básicos (últimos 30 días)
- Email soporte (48h)

### 🚀 Pro — 249 €/mes (199 €/mes anual) ⭐ MÁS POPULAR

Para negocios establecidos que quieren presencia profesional consistente.

- 8 redes sociales conectadas
- Posts ilimitados
- 1.000 créditos IA / mes
- 3 brand kits
- 5 usuarios
- Todo lo de Starter +
- Workflow aprobación cliente con link público
- Analytics avanzados (12 meses, comparativas)
- Repurposing automático (blog/podcast → posts)
- Soporte prioritario (12h)
- Onboarding 1:1 incluido

### 🏢 Agency — 599 €/mes (479 €/mes anual)

Para agencias y multi-marca.

- 30 redes sociales
- Posts ilimitados
- 5.000 créditos IA / mes
- Brand kits ilimitados
- 15 usuarios
- Todo lo de Pro +
- White-label parcial (logo + colores en aprobaciones)
- Multi-organización (gestión clientes desde una cuenta)
- Reportes white-label en PDF
- API access
- Account Manager dedicado
- Slack compartido

### Add-ons

| Add-on | Precio |
|---|---|
| Pack 100 créditos IA extra | 19 € |
| Pack 500 créditos IA extra | 79 € |
| Vídeo IA (50 min/mes) | 99 €/mes |
| Brand kit adicional (Starter) | 19 €/mes |
| Red social adicional | 9 €/mes |
| White-label completo (Agency) | 199 €/mes |

---

## Coste por crédito IA (interno)

```
1 crédito ≈ 1 generación corta (caption Twitter/X)
5 créditos ≈ 1 post completo (copy + 1 imagen para 1 plataforma)
10 créditos ≈ 1 carrusel de 5 slides
15 créditos ≈ 1 repurposing (blog → 5 posts)
50 créditos ≈ 1 vídeo IA de 8 segundos (Veo 3)
```

Coste real medio por crédito: **~$0.012**
Margen objetivo: **>80% sobre uso de IA**

---

## Calculadora unit economics (50 clientes)

```
Mix asumido:  50% Starter / 40% Pro / 10% Agency

Ingresos:
  25 × 99 €  = 2.475 €
  20 × 249 € = 4.980 €
   5 × 599 € = 2.995 €
  ─────────────────────
  Total MRR   10.450 €

Costes variables:
  Ayrshare Business (30 perfiles + 20 extras) = $779 ≈ 720 €
  Claude API (50 × ~$6)                       = $300 ≈ 280 €
  Replicate (50 × ~$3)                        = $150 ≈ 140 €
  Stripe fees (1,5% + €0,25)                  = ~150 €
  Resend / Sentry / PostHog / dominio         = ~50 €
  Supabase Pro + Vercel Pro                   = ~45 €
  ────────────────────────────────────────────
  Total CAC mensual                           ≈ 1.385 €

Margen bruto: 10.450 - 1.385 = 9.065 € (87%)
```

---

## Hitos de pricing

- **Mes 1-3**: precios iniciales con descuento "early bird -50% lifetime" para 20 primeros clientes
- **Mes 4**: precios públicos full
- **Mes 6**: subida ligera (+10%) sin afectar a clientes existentes (grandfathered)
- **Mes 12**: introducir plan Enterprise (1.500-3.000 €/mes) con SSO, SLA, contratos anuales

---

## A/B tests planificados (post-launch)

1. **Anclaje precio**: 99/249/599 vs 79/199/499 (3 meses cada uno)
2. **Trial length**: 14 vs 7 días sin tarjeta
3. **CTA pricing page**: "Empezar gratis" vs "Probar 14 días"
4. **Frecuencia billing default**: mensual vs anual
