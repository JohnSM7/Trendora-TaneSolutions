# ADR 004 — Ayrshare Business como capa de publicación

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Necesitamos publicar contenido en 8+ redes sociales (Instagram, Facebook, LinkedIn, X, TikTok, YouTube, Pinterest, Threads, Bluesky, Google Business Profile) por cuenta de muchos clientes finales.

Requisitos:
- **Multi-tenant**: cada cliente conecta sus propias cuentas, no las nuestras.
- **Aprobaciones de plataforma**: Meta, TikTok y LinkedIn requieren business verification + review (semanas/meses).
- **Mantenimiento**: las APIs cambian con frecuencia, requieren re-auth periódico.
- **Time to market**: queremos lanzar en 14 semanas.

## Opciones consideradas

| Opción | Time to market | Coste/cliente | Riesgo | Margen |
|---|---|---|---|---|
| **Ayrshare Business** | 1 semana integración | ~$15-25 | Bajo (SaaS estable) | Alto |
| Postiz self-hosted | 3 semanas + aprobaciones | ~$0 marginal | Alto (AGPL = liberar código) | Máximo |
| Mixpost self-hosted | 3 semanas + aprobaciones | ~$0 marginal | Alto (gestión apps platforms) | Máximo |
| APIs nativas directas | 6+ meses (aprobaciones) | ~$0 marginal | Muy alto | Máximo |
| Blotato / Postproxy / Zernio | 1 semana | ~$10-30 | Medio (productos jóvenes) | Alto |

## Decisión

**Ayrshare Business plan ($599/mes con 30 perfiles, +$8.99/perfil extra).**

### Razones

1. **Multi-tenant nativo**: arquitectura `Profile Key` por cliente + `generateJWT` para flujo OAuth white-label.
2. **Aprobaciones ya hechas**: no esperamos meses por Meta/TikTok review.
3. **13 plataformas activas** + analytics + comentarios + DMs en una sola API.
4. **SLA y soporte**: incidente con plataforma → es problema suyo, no nuestro.
5. **Postiz AGPL es un riesgo legal**: ofrecer SaaS sobre código AGPL modificado nos obliga a publicar nuestras modificaciones.

### Patrón de integración

```
Cliente final (en nuestra app)
    │ "Conectar Instagram"
    ▼
Server Nitro: POST /api/social/connect
    │ llama Ayrshare POST /profiles (si no existe) → guarda profileKey en organizations
    │ llama Ayrshare POST /profiles/generateJWT
    ▼
Devuelve URL de Ayrshare (válida 30 min)
    │ usuario completa OAuth con Instagram
    ▼
Webhook Ayrshare → /api/webhooks/ayrshare
    │ actualiza social_accounts en Supabase
    ▼
UI refresca y muestra cuenta conectada
```

## Consecuencias

✅ Lanzamos en 14 semanas, no en 6+ meses
✅ Margen ~85% incluso con coste Ayrshare
✅ Foco en producto (IA, UX) en vez de en peleas con plataformas
⚠️ Dependencia de un proveedor → mitigamos con interfaz `SocialPublisher` abstracta y plan B Postiz documentado
⚠️ Si Ayrshare cae, nuestro producto cae → SLA + fallback queue con Inngest
⚠️ Cuando lleguemos a 100+ clientes, evaluar migración progresiva (LinkedIn primero, es la API más estable) para reducir el coste por cliente
