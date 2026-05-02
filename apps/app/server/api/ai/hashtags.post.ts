/**
 * POST /api/ai/hashtags
 *
 * Genera hashtags optimizados + mejor hora + tips específicos por plataforma.
 */
import { z } from 'zod'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { anthropic } from '@ai-sdk/anthropic'
import { hashtagsPrompt, calculateTextCost, costToCredits, MODEL_PRICING } from '@tane/ai'

const Body = z.object({
  orgSlug: z.string().min(3),
  topic: z.string().min(3).max(500),
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'linkedin', 'pinterest', 'threads']),
  count: z.number().int().min(3).max(30).default(12),
  location: z.string().optional(),
  language: z.enum(['es', 'en', 'ca']).default('es'),
})

const HashtagsOutputSchema = z.object({
  hashtags: z
    .array(
      z.object({
        tag: z.string(),
        volume: z.enum(['low', 'medium', 'high']),
        intent: z.string(),
        reasoning: z.string(),
      }),
    )
    .min(1),
  bestTime: z.string().nullable(),
  tips: z.array(z.string()),
})

function pickModel() {
  if (process.env.GOOGLE_AI_API_KEY) {
    return {
      model: google('gemini-1.5-flash-latest'),
      modelId: 'gemini-1.5-flash-latest' as const,
      provider: 'google',
    }
  }
  if (process.env.OPENAI_API_KEY) {
    return { model: openai('gpt-4o-mini'), modelId: 'gpt-4o-mini' as const, provider: 'openai' }
  }
  return {
    model: anthropic('claude-3-5-sonnet-latest'),
    modelId: 'claude-3-5-sonnet-latest' as const,
    provider: 'anthropic',
  }
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, org } = await requireOrgMember(event, body.orgSlug)

  const { model, modelId, provider } = pickModel()
  const start = Date.now()

  const { object, usage } = await generateObject({
    model,
    prompt: hashtagsPrompt({
      topic: body.topic,
      platform: body.platform,
      count: body.count,
      location: body.location,
      language: body.language,
    }),
    schema: HashtagsOutputSchema,
    maxTokens: 1500,
    temperature: 0.6,
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
    type: 'hashtags',
    provider,
    model: modelId,
    prompt_excerpt: body.topic.slice(0, 200),
    output_excerpt: JSON.stringify(object.hashtags.slice(0, 5)).slice(0, 500),
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    duration_ms: durationMs,
    cost_usd: costUsd,
    credits_charged: credits,
  })

  return {
    hashtags: object.hashtags,
    bestTime: object.bestTime,
    tips: object.tips,
    creditsUsed: credits,
  }
})
