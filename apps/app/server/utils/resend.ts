/**
 * Wrapper Resend que falla silenciosamente en dev cuando RESEND_API_KEY no está configurada.
 *
 * Uso: await sendTrendoraEmail(event, 'welcome', { ... }, 'user@example.com')
 */
import { sendEmail, type TemplateName, type SendEmailArgs } from '@tane/emails'
import type { H3Event } from 'h3'

export async function sendTrendoraEmail<T extends TemplateName>(
  event: H3Event,
  template: T,
  data: SendEmailArgs<T>['data'],
  to: string | string[],
): Promise<{ ok: boolean; reason?: string }> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey || process.env.RESEND_API_KEY
  const fromEmail =
    config.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'Trendora <onboarding@resend.dev>'
  const appUrl = (config.public.appUrl as string) || 'http://localhost:3000/app'

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY no configurada — email '${template}' a ${Array.isArray(to) ? to.join(',') : to} NO enviado`)
    return { ok: false, reason: 'no-api-key' }
  }

  try {
    await sendEmail(apiKey, fromEmail, {
      template,
      data,
      to,
      context: { appUrl },
    } as SendEmailArgs<T>)
    return { ok: true }
  } catch (e) {
    console.error(`[email] Error enviando '${template}':`, e)
    return { ok: false, reason: (e as Error).message }
  }
}
