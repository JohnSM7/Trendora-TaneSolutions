/**
 * POST /api/ai/generate-post
 *
 * Genera un post adaptado a múltiples plataformas para una org.
 * Usa el brand kit indicado, registra la generación y descuenta créditos.
 */
import { z } from 'zod'
import { generatePosts, costToCredits, PostGenerationInputSchema } from '@tane/ai'

const BodySchema = PostGenerationInputSchema.extend({
  orgSlug: z.string().min(3).max(40),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (data) => BodySchema.parse(data))
  const { user, org, supabase } = await requireOrgMember(event, body.orgSlug)

  // Cargar brand kit (RLS valida ownership)
  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .select('id, name, voice_prompt, tone, do_say, do_not_say, default_cta, primary_color, accent_color')
    .eq('id', body.brandKitId)
    .eq('org_id', org.id)
    .single()

  if (error || !brandKit) {
    throw createError({ statusCode: 404, statusMessage: 'Brand kit no encontrado' })
  }

  // Llamar al provider
  const result = await generatePosts({
    input: body,
    brandKit: {
      name: org.name,
      vertical: org.vertical,
      voicePrompt: brandKit.voice_prompt,
      tone: brandKit.tone,
      doSay: brandKit.do_say,
      doNotSay: brandKit.do_not_say,
      defaultCta: brandKit.default_cta,
      language: body.language,
    },
  })

  const credits = costToCredits(result.costUsd)

  // Persistir generation
  const admin = adminClient(event)
  await admin.from('generations').insert({
    org_id: org.id,
    user_id: user.id,
    type: 'text',
    provider: result.provider,
    model: result.model,
    prompt_excerpt: body.topic.slice(0, 200),
    output_excerpt: JSON.stringify(result.data.posts).slice(0, 500),
    tokens_in: result.usage.tokensIn,
    tokens_out: result.usage.tokensOut,
    duration_ms: result.usage.durationMs,
    cost_usd: result.costUsd,
    credits_charged: credits,
  })

  return {
    posts: result.data.posts,
    reasoning: result.data.reasoning,
    creditsUsed: credits,
  }
})
