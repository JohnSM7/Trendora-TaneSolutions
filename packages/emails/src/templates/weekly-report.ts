import { layout } from './_layout'

export function weeklyReportEmail(
  data: {
    orgName: string
    orgSlug: string
    weekStart: string
    weekEnd: string
    postsPublished: number
    impressions: number
    engagement: number
    bestPost?: { title: string; impressions: number; platform: string }
    delta?: { posts: number; impressions: number }
  },
  ctx: { appUrl: string },
) {
  const fmtNum = (n: number) =>
    new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const fmtPct = (n: number) => (n >= 0 ? '+' : '') + Math.round(n * 100) + '%'
  const dashboardUrl = `${ctx.appUrl}/${data.orgSlug}/analytics`

  const text = `Resumen de la semana en ${data.orgName}:

Posts publicados: ${data.postsPublished}
Impresiones: ${fmtNum(data.impressions)}
Engagement total: ${fmtNum(data.engagement)}

${data.bestPost ? `Mejor post (${data.bestPost.platform}): "${data.bestPost.title}" — ${fmtNum(data.bestPost.impressions)} impresiones` : ''}

Ver detalle: ${dashboardUrl}`

  const html = layout({
    title: `Resumen semanal · ${data.orgName}`,
    preheader: `${data.postsPublished} posts · ${fmtNum(data.impressions)} impresiones`,
    body: `
      <p>Resumen semanal del <strong>${new Date(data.weekStart).toLocaleDateString('es-ES')}</strong> al <strong>${new Date(data.weekEnd).toLocaleDateString('es-ES')}</strong>.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
        <tr>
          <td style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;width:33%;text-align:center;">
            <div style="font-size:24px;font-weight:700;">${data.postsPublished}</div>
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Posts</div>
            ${data.delta ? `<div style="font-size:11px;color:${data.delta.posts >= 0 ? '#00A883' : '#DC2626'};">${fmtPct(data.delta.posts)} vs semana anterior</div>` : ''}
          </td>
          <td width="8"></td>
          <td style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;width:33%;text-align:center;">
            <div style="font-size:24px;font-weight:700;">${fmtNum(data.impressions)}</div>
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Impresiones</div>
            ${data.delta ? `<div style="font-size:11px;color:${data.delta.impressions >= 0 ? '#00A883' : '#DC2626'};">${fmtPct(data.delta.impressions)}</div>` : ''}
          </td>
          <td width="8"></td>
          <td style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;width:33%;text-align:center;">
            <div style="font-size:24px;font-weight:700;">${fmtNum(data.engagement)}</div>
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Interacciones</div>
          </td>
        </tr>
      </table>

      ${
        data.bestPost
          ? `
        <div style="background:#FAFAFB;border-radius:8px;padding:14px;margin:16px 0;">
          <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">🏆 Mejor post de la semana</div>
          <div style="font-weight:500;margin-top:6px;">${data.bestPost.title}</div>
          <div style="font-size:12px;color:#6B7280;">${data.bestPost.platform} · ${fmtNum(data.bestPost.impressions)} impresiones</div>
        </div>
      `
          : ''
      }

      <p style="margin:24px 0;">
        <a href="${dashboardUrl}" style="background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block;">
          Ver detalle completo
        </a>
      </p>

      <p style="font-size:12px;color:#6B7280;">
        Para dejar de recibir este resumen, ajusta tus preferencias en
        <a href="${ctx.appUrl}/${data.orgSlug}/settings/notifications" style="color:#5B5BD6;">Notificaciones</a>.
      </p>
    `,
  })

  return { subject: `Tu resumen semanal: ${data.postsPublished} posts publicados`, html, text }
}
