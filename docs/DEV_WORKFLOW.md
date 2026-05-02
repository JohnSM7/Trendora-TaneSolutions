# Dev Workflow — Trendora

Guía rápida del flujo de desarrollo local.

## Arrancar todo

Necesitas **dos terminales** abiertas:

### Terminal 1 — Apps (marketing + dashboard)
```bash
pnpm dev
```
- Marketing: http://localhost:4321
- Dashboard: http://localhost:3000/app

### Terminal 2 — Inngest Dev Server (jobs en background)
```bash
pnpm inngest:dev
```
- Dev UI: http://localhost:8288
- Descubre automáticamente todas las funciones registradas en `/api/inngest`
- Te muestra cada job: schedule, status, retries, logs
- **No necesita las keys de prod** — todo en local

> ¿Por qué dos terminales? El **dev server de Inngest** es tu cola de mensajes local. Sin él, los `inngest.send()` no se procesan (el evento se manda pero nadie lo escucha).

> En **producción**, Inngest cloud (con tus keys de prod) hace de cola. En dev local, el dev server de Inngest hace lo mismo en tu máquina.

---

## Flujo completo de publicación (E2E)

Con todo arriba, el ciclo end-to-end real:

1. **Studio**: usuario genera post con OpenAI/Gemini (texto + imagen DALL-E si habilita)
2. **Guardar borrador** o **enviar a aprobación** (genera token)
3. **Cliente abre link público** `/approve/[token]` → aprueba
4. Endpoint POST `/api/approval/[token]`:
   - Cambia status `in_review` → `scheduled`
   - Llama `inngest.send({ name: 'post.scheduled' })`
5. **Inngest dev server** recibe el evento, espera al `scheduledAt`
6. Cuando llega la hora, ejecuta `publishScheduledPost`:
   - Carga el draft
   - Marca `publishing`
   - Llama `ayrshare.post(profileKey, ...)` (Free: profileKey=null usa cuenta primaria)
   - Marca `published` con los `ayrshare_post_ids` devueltos
7. **Webhook de Ayrshare** (cuando lo configures) actualizará `post_metrics` cada vez que cambien

---

## Comandos útiles

| Acción | Comando |
|---|---|
| Arrancar todo en dev | `pnpm dev` |
| Inngest dev server (otra terminal) | `pnpm inngest:dev` |
| Typecheck completo | `pnpm typecheck` |
| Tests unitarios | `pnpm test` |
| Tests E2E Playwright | `pnpm --filter @tane/app test:e2e` |
| Tests RLS contra Supabase | `pnpm test packages/db` |
| Regenerar tipos de DB | `pnpm db:types` |
| Lint + format | `pnpm format` |

---

## Probar publicación E2E sin esperar

Si tienes un draft en estado `scheduled` con `scheduled_at` ya pasado, Inngest lo intentará procesar inmediatamente cuando arranques el dev server.

Para forzar publicación instantánea:
```sql
-- En Supabase SQL Editor
update content_drafts
set scheduled_at = now() + interval '10 seconds'
where id = '<draft-id>';
```

Mira el progreso en http://localhost:8288 (Inngest UI) → tab **Functions** → `publish-scheduled-post`.

---

## Troubleshooting

### "Cannot deploy localhost functions to production"
Tienes las keys de Inngest **prod** activas y estás intentando registrar localhost. Solución: arranca `pnpm inngest:dev` y deja que descubra las funciones — no necesitas las keys de prod en dev.

### "Inngest send falló"
- ¿Has arrancado `pnpm inngest:dev`? Sin él los eventos van al vacío.
- Mira la pestaña **Events** en http://localhost:8288

### Ayrshare devuelve 401 al publicar
- Plan Free: ¿has conectado tus redes en https://app.ayrshare.com/social-accounts?
- Plan Business: ¿el `profileKey` de la org existe en Ayrshare?

### Imagen IA no se persiste en Storage
- Mira el bucket `brand-assets` en Supabase Studio
- Verifica que el `service_role_key` está bien (sin él el upload falla por RLS)
