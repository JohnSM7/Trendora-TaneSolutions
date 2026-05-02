import Replicate from 'replicate'
import { imageGenerationPrompt } from '../prompts/image-generation'
import { IMAGE_PRICING_USD } from '../pricing'
import type { ImageGenerationInput } from '../schemas'
import type { GenerationResult, ImageProvider } from './types'

const REPLICATE_VERSIONS: Partial<Record<ImageProvider, string>> = {
  'replicate-nano-banana': 'google/nano-banana',
  'replicate-flux-pro': 'black-forest-labs/flux-1.1-pro',
  'replicate-flux-schnell': 'black-forest-labs/flux-schnell',
}

const PROVIDER_TO_PRICE_KEY: Record<ImageProvider, keyof typeof IMAGE_PRICING_USD> = {
  'replicate-nano-banana': 'nano-banana',
  'replicate-flux-pro': 'flux-pro',
  'replicate-flux-schnell': 'flux-schnell',
  'gemini-nano-banana': 'nano-banana',
  'openai-dalle-3': 'sd3-large',
}

interface GenerateImageArgs {
  input: ImageGenerationInput
  brandHints?: { primaryColor?: string | null; accentColor?: string | null }
  provider?: ImageProvider
  /** API token. Para Replicate: REPLICATE_API_TOKEN. Para Gemini: GOOGLE_AI_API_KEY. Para OpenAI: OPENAI_API_KEY. */
  apiToken: string
}

/**
 * Selecciona automáticamente el provider de imagen según API keys disponibles.
 * Preferencia: Gemini (Nano Banana directo) > Replicate > OpenAI
 */
function defaultProvider(): ImageProvider {
  if (process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    return 'gemini-nano-banana'
  if (process.env.REPLICATE_API_TOKEN) return 'replicate-nano-banana'
  if (process.env.OPENAI_API_KEY) return 'openai-dalle-3'
  return 'gemini-nano-banana'
}

export async function generateImage({
  input,
  brandHints = {},
  provider,
  apiToken,
}: GenerateImageArgs): Promise<GenerationResult<{ urls: string[] }>> {
  const chosen = provider ?? defaultProvider()
  const start = Date.now()
  const enrichedPrompt = imageGenerationPrompt(input, brandHints)

  let urls: string[] = []
  let modelLabel = ''

  if (chosen === 'gemini-nano-banana') {
    urls = await generateWithGemini(enrichedPrompt, input, apiToken)
    modelLabel = 'gemini-2.5-flash-image'
  } else if (chosen === 'openai-dalle-3') {
    urls = await generateWithOpenAI(enrichedPrompt, input, apiToken)
    modelLabel = 'dall-e-3'
  } else {
    urls = await generateWithReplicate(chosen, enrichedPrompt, input, apiToken)
    modelLabel = REPLICATE_VERSIONS[chosen]!
  }

  const durationMs = Date.now() - start
  const costUsd = IMAGE_PRICING_USD[PROVIDER_TO_PRICE_KEY[chosen]] * urls.length

  return {
    data: { urls },
    usage: { tokensIn: 0, tokensOut: 0, durationMs },
    costUsd,
    model: modelLabel,
    provider: chosen,
  }
}

// --- Implementaciones por provider ----------------------------------------

async function generateWithGemini(
  prompt: string,
  input: ImageGenerationInput,
  apiKey: string,
): Promise<string[]> {
  // Gemini 2.5 Flash Image (Nano Banana) — REST directa.
  // Devuelve imágenes en base64 que convertimos a data URL.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`

  const promises = Array.from({ length: input.count }).map(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Gemini image API error ${res.status}: ${text.slice(0, 300)}`)
    }
    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>
        }
      }>
    }
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
    if (!part?.inlineData?.data) throw new Error('Gemini no devolvió imagen')
    const mime = part.inlineData.mimeType ?? 'image/png'
    return `data:${mime};base64,${part.inlineData.data}`
  })

  return Promise.all(promises)
}

async function generateWithOpenAI(
  prompt: string,
  input: ImageGenerationInput,
  apiKey: string,
): Promise<string[]> {
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '4:5': '1024x1024',
    '9:16': '1024x1792',
    '16:9': '1792x1024',
  }
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: Math.min(input.count, 1), // dall-e-3 solo soporta n=1
      size: sizeMap[input.aspectRatio] ?? '1024x1024',
      response_format: 'url',
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI image API error ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as { data: Array<{ url: string }> }
  return json.data.map((d) => d.url)
}

async function generateWithReplicate(
  provider: ImageProvider,
  prompt: string,
  input: ImageGenerationInput,
  apiToken: string,
): Promise<string[]> {
  const replicate = new Replicate({ auth: apiToken })
  const modelVersion = REPLICATE_VERSIONS[provider]
  if (!modelVersion) throw new Error(`Replicate provider no soportado: ${provider}`)

  const output = (await replicate.run(modelVersion as `${string}/${string}`, {
    input: {
      prompt,
      aspect_ratio: input.aspectRatio,
      num_outputs: input.count,
      output_format: 'webp',
      output_quality: 90,
    },
  })) as unknown

  return Array.isArray(output) ? (output as string[]) : typeof output === 'string' ? [output] : []
}
