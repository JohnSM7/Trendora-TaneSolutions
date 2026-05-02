import { EventSchemas, Inngest } from 'inngest'

/**
 * Cliente Inngest singleton.
 *
 * En dev local: usa el Inngest Dev Server (arranca con `pnpm inngest:dev`).
 * En producción: las keys (event_key + signing_key) se leen de Vercel env vars.
 *
 * Tipamos los eventos con EventSchemas.fromRecord<>() para que `inngest.send()`
 * tenga autocompletado y validación.
 */
const isDev = process.env.NODE_ENV !== 'production'
export type Events = {
  'post.scheduled': {
    data: { draftId: string; orgId: string; scheduleAt: string }
  }
  'post.publish.failed': {
    data: { draftId: string; orgId: string; error: string; retryCount: number }
  }
  'post.metrics.fetch': {
    data: { orgId: string }
  }
  'ai.image.generate': {
    data: {
      orgId: string
      userId: string
      brandKitId: string
      prompt: string
      aspectRatio: string
    }
  }
  'user.signup': {
    data: { userId: string; email: string }
  }
}

export const inngest = new Inngest({
  id: 'trendora',
  schemas: new EventSchemas().fromRecord<Events>(),
  // En dev: el cliente envía eventos al dev server local (localhost:8288).
  // En prod: usa INNGEST_EVENT_KEY de las env vars (Vercel) automáticamente.
  ...(isDev ? { isDev: true } : {}),
})
