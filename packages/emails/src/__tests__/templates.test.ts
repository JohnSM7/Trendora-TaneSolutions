import { describe, it, expect } from 'vitest'
import { welcomeEmail } from '../templates/welcome'
import { trialEndingEmail } from '../templates/trial-ending'
import { approvalRequestedEmail } from '../templates/approval-requested'
import { postPublishedEmail } from '../templates/post-published'
import { postFailedEmail } from '../templates/post-failed'
import { weeklyReportEmail } from '../templates/weekly-report'

const ctx = { appUrl: 'https://trendora.tanesolutions.com/app' }

describe('Email templates — Smoke tests', () => {
  it('welcome incluye nombre y URL', () => {
    const r = welcomeEmail({ name: 'Carmen', orgSlug: 'la-strada' }, ctx)
    expect(r.subject).toContain('Bienvenido')
    expect(r.html).toContain('Carmen')
    expect(r.html).toContain('https://trendora.tanesolutions.com/app/la-strada')
    expect(r.text).toContain('Carmen')
  })

  it('welcome funciona sin nombre', () => {
    const r = welcomeEmail({}, ctx)
    expect(r.html).toContain('Hola,')
  })

  it('trial-ending menciona días restantes en subject', () => {
    const r = trialEndingEmail(
      { orgName: 'La Strada', orgSlug: 'la-strada', daysLeft: 3 },
      ctx,
    )
    expect(r.subject).toContain('3 días')
    expect(r.html).toContain('3 día')
  })

  it('trial-ending pluraliza correctamente con 1 día', () => {
    const r = trialEndingEmail(
      { orgName: 'X', orgSlug: 'x', daysLeft: 1 },
      ctx,
    )
    expect(r.subject).toContain('1 día')
    expect(r.subject).not.toContain('1 días')
  })

  it('approval-requested incluye link con token', () => {
    const r = approvalRequestedEmail(
      {
        orgName: 'La Strada',
        postExcerpt: 'Anuncio del menú de Pascua',
        platforms: ['instagram', 'facebook'],
        approvalToken: 'tok_xyz',
      },
      ctx,
    )
    expect(r.html).toContain('https://trendora.tanesolutions.com/app/approve/tok_xyz')
    expect(r.html).toContain('La Strada')
    expect(r.html).toContain('instagram')
  })

  it('post-published incluye URLs de las plataformas', () => {
    const r = postPublishedEmail(
      {
        orgName: 'La Strada',
        orgSlug: 'la-strada',
        postExcerpt: 'Pizza margherita',
        platforms: [
          { name: 'Instagram', url: 'https://instagram.com/p/123' },
          { name: 'Facebook' },
        ],
      },
      ctx,
    )
    expect(r.html).toContain('https://instagram.com/p/123')
    expect(r.html).toContain('Facebook')
  })

  it('post-failed muestra el motivo prominentemente', () => {
    const r = postFailedEmail(
      {
        orgName: 'X',
        orgSlug: 'x',
        postExcerpt: 'Texto',
        reason: 'Token de Instagram caducado',
        draftId: 'draft1',
      },
      ctx,
    )
    expect(r.html).toContain('Token de Instagram caducado')
  })

  it('weekly-report calcula deltas correctamente', () => {
    const r = weeklyReportEmail(
      {
        orgName: 'La Strada',
        orgSlug: 'la-strada',
        weekStart: '2026-04-18',
        weekEnd: '2026-04-25',
        postsPublished: 14,
        impressions: 12500,
        engagement: 850,
        delta: { posts: 0.4, impressions: 0.25 },
      },
      ctx,
    )
    expect(r.subject).toContain('14 posts')
    expect(r.html).toContain('+40%')
    expect(r.html).toContain('+25%')
  })

  it('todos los templates devuelven HTML, texto y subject no vacíos', () => {
    const all = [
      welcomeEmail({ name: 'X' }, ctx),
      trialEndingEmail({ orgName: 'X', orgSlug: 'x', daysLeft: 1 }, ctx),
      approvalRequestedEmail(
        { orgName: 'X', postExcerpt: 'X', platforms: ['x'], approvalToken: 't' },
        ctx,
      ),
      postPublishedEmail(
        { orgName: 'X', orgSlug: 'x', postExcerpt: 'X', platforms: [{ name: 'X' }] },
        ctx,
      ),
      postFailedEmail({ orgName: 'X', orgSlug: 'x', postExcerpt: 'X', reason: 'X', draftId: 'X' }, ctx),
      weeklyReportEmail(
        {
          orgName: 'X',
          orgSlug: 'x',
          weekStart: '2026-04-18',
          weekEnd: '2026-04-25',
          postsPublished: 0,
          impressions: 0,
          engagement: 0,
        },
        ctx,
      ),
    ]
    for (const r of all) {
      expect(r.subject).toBeTruthy()
      expect(r.html).toBeTruthy()
      expect(r.text).toBeTruthy()
    }
  })
})
