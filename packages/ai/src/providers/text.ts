import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'

import {
  PostGenerationOutputSchema,
  type PostGenerationInput,
  type PostGenerationOutput,
} from '../schemas'
import { systemPromptForBrandKit, postGenerationPrompt, type BrandKitContext } from '../prompts'
import { calculateTextCost, MODEL_PRICING } from '../pricing'
import type { GenerationResult, TextProvider } from './types'

interface GeneratePostsArgs {
  input: PostGenerationInput
  brandKit: BrandKitContext
  provider?: TextProvider
}

const MODEL_BY_PROVIDER: Record<TextProvider, keyof typeof MODEL_PRICING> = {
  // Modelos reales y actuales. Cuando salgan versiones nuevas, actualizar aquí + en MODEL_PRICING.
  anthropic: 'claude-3-5-sonnet-latest',
  openai: 'gpt-4o-mini',
  google: 'gemini-1.5-flash-latest',
}

/**
 * Selecciona el provider por defecto según las API keys disponibles.
 *
 * Orden de preferencia:
 *   1. Google (Gemini 2.5 Pro) — buen balance calidad/coste, Nano Banana para imágenes
 *   2. OpenAI (GPT-5) — fallback robusto
 *   3. Anthropic (Claude Sonnet 4.6) — calidad superior cuando lo necesitemos
 */
function defaultProvider(): TextProvider {
  if (process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'google'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return 'google'
}

export async function generatePosts({
  input,
  brandKit,
  provider,
}: GeneratePostsArgs): Promise<GenerationResult<PostGenerationOutput>> {
  const chosen = provider ?? defaultProvider()
  const modelId = MODEL_BY_PROVIDER[chosen]

  const model =
    chosen === 'anthropic'
      ? anthropic(modelId)
      : chosen === 'openai'
        ? openai(modelId)
        : google(modelId)

  const start = Date.now()

  const { object, usage } = await generateObject({
    model,
    system: systemPromptForBrandKit(brandKit),
    prompt: postGenerationPrompt(input),
    schema: PostGenerationOutputSchema,
    maxTokens: 2000,
    temperature: 0.7,
  })

  const durationMs = Date.now() - start

  const tokensIn = usage?.promptTokens ?? 0
  const tokensOut = usage?.completionTokens ?? 0
  const costUsd = calculateTextCost(modelId, tokensIn, tokensOut)

  return {
    data: object,
    usage: { tokensIn, tokensOut, durationMs },
    costUsd,
    model: modelId,
    provider: chosen,
  }
}
