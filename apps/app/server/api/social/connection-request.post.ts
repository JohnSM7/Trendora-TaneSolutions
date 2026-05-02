/**
 * POST /api/social/connection-request
 *
 * Registra que un cliente ha solicitado conexión de redes (modo Free, onboarding asistido).
 * El cliente abre el mailto pero queremos trazabilidad aunque cierre el cliente de email
 * sin enviar.
 *
 * También dispara un email a hola@tanesolutions.com con los detalles para que el equipo
 * de Tane pueda agendar la sesión sin esperar al email del cliente.
 */
import { z } from 'zod'

const Body = z.object({
  orgSlug: z.string().min(3).max(40),
  platforms: z.array(z.string()).max(20).default([]),
  notes: z.string().max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org } = await requireOrgMember(event, body.orgSlug)

  const admin = adminClient(event)

  // Anti-spam: máximo 3 solicitudes por org en 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .eq('action', 'social.connection_requested')
    .gte('created_at', since)

  if ((count ?? 0) >= 3) {
    throw createError({
      statusCode: 429,
      statusMessage:
        'Ya has enviado varias solicitudes recientemente. Te contactaremos pronto.',
    })
  }

  // Registrar en audit_log
  const userAgent = getHeader(event, 'user-agent') ?? null
  await admin.from('audit_log').insert({
    org_id: org.id,
    user_id: user.id,
    action: 'social.connection_requested',
    metadata: {
      requested_platforms: body.platforms,
      notes: body.notes ?? null,
      user_email: user.email,
      org_slug: org.slug,
      org_name: org.name,
      plan: org.plan,
    },
    user_agent: userAgent,
  })

  // Notificar al equipo via Resend (best-effort, no bloquea si falla)
  try {
    const config = useRuntimeConfig()
    const resendKey = config.resendApiKey || process.env.RESEND_API_KEY
    const fromEmail =
      config.resendFromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      'Trendora <onboarding@resend.dev>'

    if (resendKey) {
      const platformList =
        body.platforms.length > 0
          ? body.platforms.join(', ')
          : '(no especificadas — preguntar al cliente)'

      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          from: fromEmail,
          to: ['hola@tanesolutions.com'],
          reply_to: user.email,
          subject: `[Trendora] Nueva solicitud de conexión: ${org.name}`,
          html: `
            <h2>Solicitud de conexión de redes</h2>
            <p><strong>Cliente:</strong> ${user.email}</p>
            <p><strong>Organización:</strong> ${org.name} (<code>${org.slug}</code>)</p>
            <p><strong>Plan:</strong> ${org.plan}</p>
            <p><strong>Plataformas pedidas:</strong> ${platformList}</p>
            ${body.notes ? `<p><strong>Notas:</strong><br>${body.notes.replace(/\n/g, '<br>')}</p>` : ''}
            <hr>
            <p style="font-size: 12px; color: #666;">
              Próximos pasos: agenda 15 min con el cliente y guíale en
              <a href="https://app.ayrshare.com/social-accounts">app.ayrshare.com/social-accounts</a>.
              Ver protocolo en <code>docs/CLIENT_ONBOARDING.md</code>.
            </p>
          `,
        },
      })
    }
  } catch (e) {
    console.warn('[social/connection-request] Resend notify falló:', e)
  }

  return { ok: true }
})
