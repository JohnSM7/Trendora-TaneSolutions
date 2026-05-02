/**
 * POST /api/ai/generate-image
 *
 * Genera 1-4 imágenes y las sube a Supabase Storage. Devuelve URLs firmadas.
 *
 * Provider auto-seleccionado según API keys disponibles:
 *   1. GOOGLE_AI_API_KEY → Gemini 2.5 Flash Image (Nano Banana directo)
 *   2. REPLICATE_API_TOKEN → Replicate (Nano Banana / Flux)
 *   3. OPENAI_API_KEY → DALL-E 3
 */
import { z } from 'zod'
import { generateImage, costToCredits, ImageGenerationInputSchema } from '@tane/ai'

const Body = ImageGenerationInputSchema.extend({ orgSlug: z.string().min(3) })

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org, supabase } = await requireOrgMember(event, body.orgSlug)
  const config = useRuntimeConfig()

  // Brand kit
  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .select('id, primary_color, accent_color')
    .eq('id', body.brandKitId)
    .eq('org_id', org.id)
    .single()
  if (error || !brandKit) {
    throw createError({ statusCode: 404, statusMessage: 'Brand kit no encontrado' })
  }

  // Aceptamos tanto runtimeConfig (`NUXT_*`) como env var directa (`OPENAI_API_KEY`).
  const apiToken =
    config.googleAiApiKey ||
    process.env.GOOGLE_AI_API_KEY ||
    config.replicateApiToken ||
    process.env.REPLICATE_API_TOKEN ||
    config.openaiApiKey ||
    process.env.OPENAI_API_KEY ||
    ''

  if (!apiToken) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Falta API key de imagen. Configura GOOGLE_AI_API_KEY (recomendado), REPLICATE_API_TOKEN u OPENAI_API_KEY.',
    })
  }

  const result = await generateImage({
    input: body,
    brandHints: {
      primaryColor: brandKit.primary_color,
      accentColor: brandKit.accent_color,
    },
    apiToken,
  })

  // Subir las URLs/data URLs a nuestro Storage
  const admin = adminClient(event)
  const persistedUrls: string[] = []

  for (const [i, url] of result.data.urls.entries()) {
    try {
      let blob: ArrayBuffer
      let contentType = 'image/webp'

      if (url.startsWith('data:')) {
        // data URL devuelta por Gemini
        const match = url.match(/^data:([^;]+);base64,(.+)$/)
        if (!match) continue
        contentType = match[1] ?? 'image/png'
        blob = Uint8Array.from(atob(match[2] ?? ''), (c) => c.charCodeAt(0)).buffer
      } else {
        const fetched = await fetch(url)
        if (!fetched.ok) continue
        blob = await fetched.arrayBuffer()
        contentType = fetched.headers.get('content-type') ?? 'image/webp'
      }

      const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp'
      const path = `${org.id}/generated/${Date.now()}-${i}.${ext}`
      const { error: uploadErr } = await admin.storage
        .from('brand-assets')
        .upload(path, blob, { contentType, upsert: false })

      if (!uploadErr) {
        const { data: signed } = await admin.storage
          .from('brand-assets')
          .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 días
        if (signed?.signedUrl) {
          persistedUrls.push(signed.signedUrl)
          continue
        }
      }
      // Fallback: la URL original (data URL no funciona en cliente persistente, pero algo es algo)
      persistedUrls.push(url)
    } catch {
      persistedUrls.push(url)
    }
  }

  const credits = costToCredits(result.costUsd)

  await admin.from('generations').insert({
    org_id: org.id,
    user_id: user.id,
    type: 'image',
    provider: result.provider,
    model: result.model,
    prompt_excerpt: body.prompt.slice(0, 200),
    output_excerpt: persistedUrls[0] ?? null,
    duration_ms: result.usage.durationMs,
    cost_usd: result.costUsd,
    credits_charged: credits,
  })

  return {
    urls: persistedUrls,
    creditsUsed: credits,
  }
})
