import { layout } from './_layout'

export function trialEndingEmail(
  data: { name?: string; orgName: string; orgSlug: string; daysLeft: number },
  ctx: { appUrl: string },
) {
  const billingUrl = `${ctx.appUrl}/${data.orgSlug}/settings/billing`

  const text = `${data.name ? `Hola ${data.name},` : 'Hola,'}

Te quedan ${data.daysLeft} día(s) de prueba en Trendora con la cuenta de ${data.orgName}.

Si quieres seguir publicando contenido sin perder ritmo, es buen momento para activar un plan. Tienes 3 opciones:

· Starter (99 €/mes): para autónomos
· Pro (249 €/mes): para negocios establecidos · más popular
· Agency (599 €/mes): para gestionar varias marcas

Activar plan: ${billingUrl}

Si tienes dudas o prefieres una llamada de 15 min para decidir, responde a este email.

Un abrazo,
Tane`

  const html = layout({
    title: `Tu prueba de Tane acaba en ${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'}`,
    preheader: 'Activa un plan para no perder ritmo.',
    body: `
      <p>${data.name ? `Hola ${data.name},` : 'Hola,'}</p>
      <p>Te quedan <strong>${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'}</strong> de prueba con la cuenta de <strong>${data.orgName}</strong>.</p>
      <p>Si quieres seguir publicando sin pausa, ahora es el momento.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
        <tr>
          <td style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;width:33%;text-align:center;">
            <div style="font-weight:600;">Starter</div>
            <div style="font-size:20px;font-weight:700;color:#5B5BD6;">99 €</div>
            <div style="color:#6B7280;font-size:12px;">/mes</div>
          </td>
          <td width="8"></td>
          <td style="border:2px solid #5B5BD6;border-radius:8px;padding:14px;width:33%;text-align:center;background:#5B5BD60D;">
            <div style="font-weight:600;">Pro ⭐</div>
            <div style="font-size:20px;font-weight:700;color:#5B5BD6;">249 €</div>
            <div style="color:#6B7280;font-size:12px;">/mes</div>
          </td>
          <td width="8"></td>
          <td style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;width:33%;text-align:center;">
            <div style="font-weight:600;">Agency</div>
            <div style="font-size:20px;font-weight:700;color:#5B5BD6;">599 €</div>
            <div style="color:#6B7280;font-size:12px;">/mes</div>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0;">
        <a href="${billingUrl}" style="background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block;">
          Activar plan →
        </a>
      </p>
      <p>Si dudas o prefieres una llamada de 15 min, responde a este email.</p>
      <p>Un abrazo,<br/><strong>Tane</strong></p>
    `,
  })

  return {
    subject: `Tu prueba acaba en ${data.daysLeft} día${data.daysLeft === 1 ? '' : 's'}`,
    html,
    text,
  }
}
