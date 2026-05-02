# Client Onboarding — Modo Asistido (Ayrshare Free)

> Guía para Tane Solutions sobre cómo dar de alta nuevos clientes en Trendora durante la fase de validación. Aplica hasta llegar a 5+ clientes pagando, momento en que se migra a Ayrshare Business plan.

## El modelo de negocio en esta fase

- **Una sola cuenta Ayrshare Free** (la de Tane Solutions) con todas las redes de todos los clientes conectadas
- Cada cliente tiene su propia **organización en Trendora** (multi-tenant lógico): brand kit, contenido, equipo, métricas separadas
- Las publicaciones técnicamente salen de la cuenta única de Ayrshare, pero al publicar en Instagram/Facebook/etc. lo hacen desde la cuenta del cliente (porque es esa cuenta la que está autorizada)

---

## Flujo paso a paso (para Tane Solutions, ~15 min/cliente)

### Paso 1 — Cliente solicita conexión

Cuando el cliente clica **"✉️ Solicitar conexión"** en `Settings → Redes sociales`, ocurren 3 cosas en paralelo:

1. **Registro en BD** (`audit_log` con `action = 'social.connection_requested'`) — para que tengas traza aunque el cliente cierre el cliente de email sin enviar.
2. **Email automático** a `hola@tanesolutions.com` desde Resend con asunto `[Trendora] Nueva solicitud de conexión: [Nombre Org]`, que incluye email del cliente, plan, plataformas pedidas, y `reply_to` apuntando al cliente.
3. **Mailto pre-rellenado** se abre en el cliente de email del usuario por si quiere completar/editar.

Para ver todas las solicitudes pendientes (consulta SQL en Supabase Studio):

```sql
select
  a.created_at,
  o.name as org,
  o.plan,
  a.metadata->>'user_email' as cliente_email,
  a.metadata->'requested_platforms' as plataformas
from audit_log a
join organizations o on o.id = a.org_id
where a.action = 'social.connection_requested'
order by a.created_at desc
limit 50;
```

> **Anti-spam**: el endpoint `POST /api/social/connection-request` rechaza con 429 si una org ha hecho ≥3 solicitudes en 24h. Esto protege ante usuarios impacientes que claren el botón muchas veces.

### Paso 2 — Confirmar identidad y plan
Antes de conectar nada:
- Verifica que el cliente tiene una org activa en Trendora (Supabase Studio → `organizations` → buscar slug)
- Confirma plan (`trial`, `starter`, `pro`, `agency`) — si está en trial avísale que tiene 14 días
- Si pide más redes que las que su plan permite (Starter = 3, Pro = 8, Agency = 30), avísale

### Paso 3 — Recoger credenciales
Responde al email con plantilla:

```
¡Hola [nombre]!

Para conectar tus redes a Trendora necesito que hagas esto desde tu ordenador
(15 min máximo):

1. Abre este enlace: https://app.ayrshare.com/social-accounts
   - Login con: hola@tanesolutions.com (te paso credenciales por canal seguro
     o agendamos llamada)

2. Click en "+ Add Account" → elige la red (Instagram, Facebook, etc.)

3. Te pedirá login con TU cuenta de esa red. Login con tus credenciales reales.

4. Cuando estén conectadas avísame.

Importante: Solo te pediremos esto una vez. A partir de ahí puedes publicar
desde Trendora con un clic — no tienes que entrar nunca más a Ayrshare.

¿Cuándo te viene bien? Puedo agendar 15 min vía Cal:
https://cal.com/tane/trendora-onboarding

Un abrazo,
Tane
```

### Paso 4 — Sesión asistida (videollamada)
- Tú compartes pantalla pero el cliente teclea sus credenciales (NUNCA se las pidas en chat)
- Si Instagram: comprobar que tiene cuenta business y página de Facebook conectada
- Si LinkedIn: empresa o personal — preguntar
- Si X: simple OAuth
- Si TikTok: requiere business account

### Paso 5 — Verificación en Trendora
1. Cliente abre Trendora → `Settings → Redes sociales` → click "↻ Actualizar"
2. Deben aparecer todas las redes conectadas con check verde
3. Cliente prueba: Studio → genera un post → programa para 1 minuto en el futuro → mira su Instagram en 1 min — el post debería aparecer

### Paso 6 — Documentar internamente
Crear entrada en una hoja Google Sheet o Notion con:
- Email cliente
- Nombre org Trendora
- Slug
- Plan
- Redes conectadas
- Fecha conexión
- Notas de incidencias

Esto te servirá cuando migres a Ayrshare Business para hacer la migración ordenadamente.

---

## Trampas comunes y soluciones

### "Instagram no se conecta"
Siempre el mismo problema: el cliente no tiene cuenta **Business** o no tiene **página de Facebook** asociada. Solución:
1. https://business.instagram.com → "Cambiar a cuenta profesional" → Empresa
2. Crear página Facebook (puede ser básica)
3. Asociar la página al Instagram desde Configuración Instagram

### "TikTok dice que necesita un dominio verificado"
TikTok Content Posting API exige tener tu propio dominio verificado en TikTok Developer. Mientras estés en modo Free, esto se soluciona con:
- Si el cliente tiene web: añade el meta tag de TikTok en el head
- Si no: este cliente no puede publicar en TikTok hasta que migremos a Ayrshare Business

### "El post se publicó pero salió desde MI cuenta y no la suya"
Verifica en Ayrshare → Profiles que estamos usando la cuenta primaria. En modo Free no hay profileKey, todo va por defecto. Si la cuenta del cliente no aparece en `Active Social Accounts`, no se está usando la suya.

### "Quiero desconectar mis redes"
Cliente puede mandar email — tú entras a Ayrshare y eliminas las cuentas. El cliente NO puede hacerlo solo en modo Free. Esto se anota como mejora obvia para Ayrshare Business.

---

## Cuando migrar a Ayrshare Business

**Triggers**:
- ≥5 clientes pagando ≥99€/mes (cubre los $599 de Ayrshare con margen)
- O ≥3 clientes pagando + 2-3 a mes vista (preventivo)
- O cualquier cliente que pague Agency 599€/mes (única org cubre el coste)

**Plan de migración** (1 día de trabajo):
1. Upgrade Ayrshare a Business
2. Genera Private Key (JWT) → ponerla en `.env` y Vercel
3. **Para cada cliente existente**:
   - Crea profile en Ayrshare con `POST /profiles`
   - Guarda `profileKey` en `organizations.ayrshare_profile_key`
   - Email al cliente: "Te estamos migrando a un sistema mejor donde tú gestionas tus redes. Vas a recibir un nuevo enlace de conexión, dale clic y reconecta tus redes una sola vez."
4. Cliente clica "Conectar nueva cuenta" en Settings → flujo OAuth white-label → reconecta sus redes (esta vez bajo SU profileKey)
5. Una vez todos migrados, en Ayrshare → eliminar las cuentas conectadas a la cuenta primaria (ya no se usan)

El código ya está preparado para Business — detecta automáticamente si hay `AYRSHARE_PRIVATE_KEY` y cambia el comportamiento. **No hay que tocar código en la migración**.

---

## SLA con cliente en modo Free

Comprometernos a:
- Responder solicitud en <12h laborables
- Completar conexión en <48h laborables
- Si una red se desconecta (token expirado), reconectar en <24h

Esto se anuncia en el email de bienvenida y en `Settings → Redes sociales`.
