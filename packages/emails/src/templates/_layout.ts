/**
 * Layout HTML base. Email-safe (sin flexbox/grid moderno).
 */
export function layout(args: {
  preheader: string
  title: string
  body: string
  footerNote?: string
}): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${args.title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B0F19;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
${args.preheader}
</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAFB;padding:40px 20px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;max-width:560px;">
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #F3F4F6;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#5B5BD6;color:#fff;font-weight:700;width:32px;height:32px;border-radius:6px;text-align:center;font-size:14px;line-height:32px;">T</td>
                <td style="padding-left:10px;font-weight:600;font-size:15px;">Trendora</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;line-height:1.55;font-size:15px;">
            ${args.body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #F3F4F6;font-size:12px;color:#6B7280;">
            ${args.footerNote ?? 'Tane Solutions · hola@tanesolutions.com · <a href="https://tanesolutions.com" style="color:#5B5BD6;text-decoration:none;">tane.solutions</a>'}
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin-top:16px;">
        Recibes este email porque tienes una cuenta en Trendora.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
}
