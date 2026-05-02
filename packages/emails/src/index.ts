/**
 * @tane/emails — sender + templates HTML.
 *
 * Mantenemos los templates como funciones que devuelven HTML simple
 * (no React Email) para no añadir build complejo. Si crece el catálogo,
 * podemos migrar a `@react-email/components`.
 */
import { Resend } from 'resend'
import { welcomeEmail } from './templates/welcome'
import { trialEndingEmail } from './templates/trial-ending'
import { approvalRequestedEmail } from './templates/approval-requested'
import { postPublishedEmail } from './templates/post-published'
import { postFailedEmail } from './templates/post-failed'
import { weeklyReportEmail } from './templates/weekly-report'

export interface EmailContext {
  appUrl: string
  marketingUrl?: string
}

const TEMPLATES = {
  welcome: welcomeEmail,
  'trial-ending': trialEndingEmail,
  'approval-requested': approvalRequestedEmail,
  'post-published': postPublishedEmail,
  'post-failed': postFailedEmail,
  'weekly-report': weeklyReportEmail,
} as const

export type TemplateName = keyof typeof TEMPLATES

export interface SendEmailArgs<T extends TemplateName = TemplateName> {
  template: T
  to: string | string[]
  data: Parameters<(typeof TEMPLATES)[T]>[0]
  context: EmailContext
  replyTo?: string
}

let _resend: Resend | null = null
function client(apiKey: string): Resend {
  if (!_resend) _resend = new Resend(apiKey)
  return _resend
}

export async function sendEmail<T extends TemplateName>(
  apiKey: string,
  fromEmail: string,
  args: SendEmailArgs<T>,
) {
  const tpl = TEMPLATES[args.template] as (
    data: any,
    ctx: EmailContext,
  ) => { subject: string; html: string; text: string }

  const { subject, html, text } = tpl(args.data as any, args.context)

  return client(apiKey).emails.send({
    from: fromEmail,
    to: args.to,
    subject,
    html,
    text,
    replyTo: args.replyTo,
  })
}

export { layout } from './templates/_layout'
