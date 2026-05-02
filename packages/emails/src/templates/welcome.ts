import { layout } from './_layout'

export function welcomeEmail(
  data: { name?: string; orgSlug?: string },
  ctx: { appUrl: string },
) {
  const greeting = data.name ? `Hola ${data.name},` : 'Hola,'
  const ctaUrl = data.orgSlug ? `${ctx.appUrl}/${data.orgSlug}` : `${ctx.appUrl}/dashboard`

  const text = `${greeting}

Bienvenido a Trendora. Soy Tane, founder.

Antes de nada, dos minutos para sacarle partido desde el primer día:

1. Conecta tus redes en Ajustes → Redes sociales
2. Define tu marca en Brand Kits (cuanto más detallado, mejor)
3. Genera tu primer post desde Studio

Si te bloqueas en algo, responde a este mismo email — leo todos los emails personalmente la primera semana.

Empezar: ${ctaUrl}

Un abrazo,
Tane`

  const html = layout({
    title: 'Bienvenido a Trendora',
    preheader: 'Empieza con buen pie en menos de 5 minutos.',
    body: `
      <p>${greeting}</p>
      <p>Bienvenido a <strong>Trendora</strong>. Soy Tane, founder. Te lo voy a poner fácil:</p>
      <ol style="padding-left:18px;">
        <li>Conecta tus redes en <em>Ajustes → Redes sociales</em></li>
        <li>Define tu marca en <em>Brand Kits</em> (cuanto más detallado, mejor)</li>
        <li>Genera tu primer post desde <em>Studio</em></li>
      </ol>
      <p style="margin:28px 0;">
        <a href="${ctaUrl}" style="background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;display:inline-block;">
          Abrir mi cuenta →
        </a>
      </p>
      <p>Si te bloqueas en algo, responde a este mismo email. Leo todos los emails personalmente la primera semana.</p>
      <p>Un abrazo,<br/><strong>Tane</strong></p>
    `,
  })

  return { subject: '¡Bienvenido a Trendora!', html, text }
}
