/**
 * POST /api/ai/repurpose
 *
 * Convierte contenido largo (blog, transcript, newsletter) en piezas para redes.
 * Usa el provider que detecte por env vars (Gemini > OpenAI > Anthropic).
 */
import { z } from 'zod'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import {
  PostGenerationOutputSchema,
  systemPromptForBrandKit,
  repurposePrompt,
  costToCredits,
  calculateTextCost,
  MODEL_PRICING,
} from '@tane/ai'

const Body = z.object({
  orgSlug: z.string().min(3),
  brandKitId: z.string().uuid(),
  source: z.string().min(50).max(20000),
  sourceType: z.enum(['blog', 'transcript', 'newsletter', 'video']),
  targetPlatforms: z.array(z.string()).min(1).max(8),
  postsPerPlatform: z.number().int().min(1).max(5).default(3),
})

function pickModel() {
  if (process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      model: google('gemini-1.5-flash-latest'),
      modelId: 'gemini-1.5-flash-latest' as const,
      provider: 'google' as const,
    }
  }
  if (process.env.OPENAI_API_KEY) {
    return { model: openai('gpt-4o-mini'), modelId: 'gpt-4o-mini' as const, provider: 'openai' as const }
  }
  return {
    model: anthropic('claude-3-5-sonnet-latest'),
    modelId: 'claude-3-5-sonnet-latest' as const,
    provider: 'anthropic' as const,
  }
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org, supabase } = await requireOrgMember(event, body.orgSlug)

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .select('voice_prompt, tone, do_say, do_not_say, default_cta')
    .eq('id', body.brandKitId)
    .eq('org_id', org.id)
    .single()
  if (error || !brandKit) {
    throw createError({ statusCode: 404, statusMessage: 'Brand kit no encontrado' })
  }

  const { model, modelId, provider } = pickModel()

  const start = Date.now()
  const { object, usage } = await generateObject({
    model,
    system: systemPromptForBrandKit({
      name: org.name,
      vertical: org.vertical,
      voicePrompt: brandKit.voice_prompt,
      tone: brandKit.tone,
      doSay: brandKit.do_say,
      doNotSay: brandKit.do_not_say,
      defaultCta: brandKit.default_cta,
    }),
    prompt: repurposePrompt({
      source: body.source,
      sourceType: body.sourceType,
      targetPlatforms: body.targetPlatforms,
      postsPerPlatform: body.postsPerPlatform,
    }),
    schema: PostGenerationOutputSchema,
    maxTokens: 4000,
    temperature: 0.7,
  })

  const durationMs = Date.now() - start
  const tokensIn = usage?.promptTokens ?? 0
  const tokensOut = usage?.completionTokens ?? 0
  const costUsd = calculateTextCost(modelId as keyof typeof MODEL_PRICING, tokensIn, tokensOut)
  const credits = costToCredits(costUsd)

  const admin = adminClient(event)
  await admin.from('generations').insert({
    org_id: org.id,
    user_id: user.id,
    type: 'repurpose',
    provider,
    model: modelId,
    prompt_excerpt: body.source.slice(0, 200),
    output_excerpt: JSON.stringify(object.posts).slice(0, 500),
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    duration_ms: durationMs,
    cost_usd: costUsd,
    credits_charged: credits,
  })

  return { posts: object.posts, creditsUsed: credits }
})
