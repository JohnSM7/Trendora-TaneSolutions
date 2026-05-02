import { layout } from './_layout'

export function postFailedEmail(
  data: { orgName: string; orgSlug: string; postExcerpt: string; reason: string; draftId: string },
  ctx: { appUrl: string },
) {
  const url = `${ctx.appUrl}/${data.orgSlug}/calendar`

  const text = `No se pudo publicar el post.

Motivo: ${data.reason}

Texto: "${data.postExcerpt.slice(0, 200)}"

Revisar y reintentar: ${url}`

  const html = layout({
    title: 'No se pudo publicar el post',
    preheader: data.reason.slice(0, 100),
    body: `
      <p style="font-size:18px;">⚠️ No se pudo publicar tu post.</p>
      <p>Revisamos el motivo y, si es algo que podemos arreglar nosotros (token caducado, rate limit), lo reintentaremos automáticamente. Si no, necesitamos tu intervención.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FEE2E2;border-radius:8px;padding:14px;margin:16px 0;border:1px solid #FECACA;">
        <tr><td>
          <div style="font-size:11px;color:#991B1B;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Motivo</div>
          <div style="color:#991B1B;">${data.reason}</div>
        </td></tr>
      </table>
      <p style="font-size:13px;color:#6B7280;font-style:italic;">"${data.postExcerpt.slice(0, 200)}${data.postExcerpt.length > 200 ? '…' : ''}"</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block;">
          Revisar el post
        </a>
      </p>
      <p style="font-size:12px;color:#6B7280;">
        Si crees que es un error nuestro, responde a este email. Lo revisamos en horas.
      </p>
    `,
  })

  return { subject: '⚠️ No se pudo publicar el post', html, text }
}
