import { layout } from './_layout'

export function approvalRequestedEmail(
  data: {
    orgName: string
    approverName?: string
    postExcerpt: string
    platforms: string[]
    scheduledAt?: string | null
    approvalToken: string
  },
  ctx: { appUrl: string },
) {
  const url = `${ctx.appUrl}/approve/${data.approvalToken}`
  const greeting = data.approverName ? `Hola ${data.approverName},` : 'Hola,'

  const text = `${greeting}

${data.orgName} ha preparado contenido nuevo y te pide tu visto bueno antes de publicarlo en ${data.platforms.join(', ')}.

Texto del post:
"${data.postExcerpt.slice(0, 200)}${data.postExcerpt.length > 200 ? '…' : ''}"

${data.scheduledAt ? `Programado para: ${new Date(data.scheduledAt).toLocaleString('es-ES')}` : ''}

Revisar y aprobar: ${url}

(El enlace caduca en 7 días.)`

  const html = layout({
    title: `${data.orgName} pide tu visto bueno`,
    preheader: 'Revisa el post antes de que se publique.',
    body: `
      <p>${greeting}</p>
      <p><strong>${data.orgName}</strong> ha preparado contenido nuevo y te pide tu visto bueno antes de publicarlo.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAFB;border-radius:8px;padding:14px;margin:16px 0;">
        <tr><td>
          <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Texto del post</div>
          <div style="font-style:italic;color:#111;">${data.postExcerpt.slice(0, 280)}${data.postExcerpt.length > 280 ? '…' : ''}</div>
        </td></tr>
      </table>

      <p style="font-size:13px;color:#6B7280;">
        Plataformas: <strong>${data.platforms.join(', ')}</strong>
        ${data.scheduledAt ? `<br/>Programado: <strong>${new Date(data.scheduledAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</strong>` : ''}
      </p>

      <p style="margin:28px 0;">
        <a href="${url}" style="background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:500;display:inline-block;">
          Revisar y aprobar →
        </a>
      </p>

      <p style="font-size:12px;color:#6B7280;">
        Tarda menos de un minuto. Puedes aprobar, pedir cambios o dejar comentarios.
        El enlace caduca en 7 días.
      </p>
    `,
    footerNote: 'Powered by Trendora · No respondas a este email; el equipo de la marca lo gestiona desde el panel.',
  })

  return { subject: `${data.orgName} pide tu aprobación de un post`, html, text }
}
