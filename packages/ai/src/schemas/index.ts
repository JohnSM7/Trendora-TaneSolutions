import { z } from 'zod'

export const SocialPlatformSchema = z.enum([
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'pinterest',
  'threads',
  'bluesky',
])

export const PostGenerationInputSchema = z.object({
  topic: z.string().min(3).max(500),
  platforms: z.array(SocialPlatformSchema).min(1).max(8),
  tone: z.enum(['professional', 'casual', 'playful', 'inspirational', 'urgent']).optional(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  includeHashtags: z.boolean().default(true),
  includeCta: z.boolean().default(true),
  brandKitId: z.string().uuid(),
  language: z.enum(['es', 'en', 'ca']).default('es'),
})

export type PostGenerationInput = z.infer<typeof PostGenerationInputSchema>

/**
 * Output estructurado que devuelve el modelo: un post por plataforma con
 * adaptación específica de longitud y formato.
 *
 * IMPORTANTE: OpenAI structured outputs en strict mode requiere que TODOS los
 * campos estén en `required` y los opcionales sean `nullable`. Por eso no
 * usamos `.optional()` ni `.default()` aquí — usamos `.nullable()`.
 */
export const GeneratedPostSchema = z.object({
  platform: SocialPlatformSchema,
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string().nullable(),
  altText: z.string().nullable(),
  imagePrompt: z.string().nullable(),
  bestTimeHint: z.string().nullable(),
})

export const PostGenerationOutputSchema = z.object({
  posts: z.array(GeneratedPostSchema).min(1),
  reasoning: z.string().nullable(),
})

export type GeneratedPost = z.infer<typeof GeneratedPostSchema>
export type PostGenerationOutput = z.infer<typeof PostGenerationOutputSchema>

export const ImageGenerationInputSchema = z.object({
  prompt: z.string().min(5).max(1000),
  brandKitId: z.string().uuid(),
  aspectRatio: z.enum(['1:1', '4:5', '9:16', '16:9']).default('1:1'),
  style: z.enum(['photo', 'illustration', 'flatlay', 'lifestyle', 'product']).optional(),
  count: z.number().int().min(1).max(4).default(1),
})

export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>
