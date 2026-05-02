import { layout } from './_layout'

export function postPublishedEmail(
  data: {
    orgName: string
    postExcerpt: string
    platforms: Array<{ name: string; url?: string }>
    orgSlug: string
  },
  ctx: { appUrl: string },
) {
  const text = `Tu post se ha publicado correctamente en ${data.platforms.map((p) => p.name).join(', ')}.

"${data.postExcerpt.slice(0, 200)}"

Ver métricas: ${ctx.appUrl}/${data.orgSlug}/analytics`

  const html = layout({
    title: 'Post publicado',
    preheader: `Publicado en ${data.platforms.map((p) => p.name).join(', ')}.`,
    body: `
      <p style="font-size:18px;">✅ Tu post se ha publicado correctamente.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAFB;border-radius:8px;padding:14px;margin:16px 0;">
        <tr><td style="font-style:italic;color:#111;">
          ${data.postExcerpt.slice(0, 280)}${data.postExcerpt.length > 280 ? '…' : ''}
        </td></tr>
      </table>
      <p style="font-size:13px;">
        ${data.platforms
          .map((p) =>
            p.url
              ? `<a href="${p.url}" style="color:#5B5BD6;text-decoration:none;">→ Ver en ${p.name}</a>`
              : `→ ${p.name}`,
          )
          .join('<br/>')}
      </p>
      <p style="margin:24px 0;">
        <a href="${ctx.appUrl}/${data.orgSlug}/analytics" style="border:1px solid #E5E7EB;color:#0B0F19;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:500;display:inline-block;">
          Ver métricas
        </a>
      </p>
    `,
  })

  return { subject: '✅ Post publicado correctamente', html, text }
}
