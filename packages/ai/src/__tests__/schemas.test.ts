import { describe, it, expect } from 'vitest'
import {
  PostGenerationInputSchema,
  PostGenerationOutputSchema,
  ImageGenerationInputSchema,
  GeneratedPostSchema,
  SocialPlatformSchema,
} from '../schemas'

describe('PostGenerationInputSchema', () => {
  it('acepta input válido mínimo', () => {
    const result = PostGenerationInputSchema.safeParse({
      topic: 'Anuncio del nuevo menú',
      platforms: ['instagram'],
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza topic demasiado corto', () => {
    const result = PostGenerationInputSchema.safeParse({
      topic: 'X',
      platforms: ['instagram'],
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza si no hay plataformas', () => {
    const result = PostGenerationInputSchema.safeParse({
      topic: 'Algo válido',
      platforms: [],
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('aplica defaults', () => {
    const result = PostGenerationInputSchema.parse({
      topic: 'Anuncio del nuevo menú',
      platforms: ['instagram'],
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.length).toBe('medium')
    expect(result.includeHashtags).toBe(true)
    expect(result.includeCta).toBe(true)
    expect(result.language).toBe('es')
  })

  it('valida brandKitId como UUID', () => {
    const result = PostGenerationInputSchema.safeParse({
      topic: 'Algo',
      platforms: ['instagram'],
      brandKitId: 'no-es-un-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('GeneratedPostSchema', () => {
  it('acepta post mínimo', () => {
    const result = GeneratedPostSchema.safeParse({
      platform: 'instagram',
      caption: '¡Pizza recién salida del horno!',
    })
    expect(result.success).toBe(true)
  })

  it('aplica default vacío en hashtags', () => {
    const result = GeneratedPostSchema.parse({
      platform: 'instagram',
      caption: 'X',
    })
    expect(result.hashtags).toEqual([])
  })
})

describe('PostGenerationOutputSchema', () => {
  it('exige al menos 1 post', () => {
    const result = PostGenerationOutputSchema.safeParse({ posts: [] })
    expect(result.success).toBe(false)
  })

  it('acepta varios posts con reasoning', () => {
    const result = PostGenerationOutputSchema.safeParse({
      posts: [
        { platform: 'instagram', caption: 'A' },
        { platform: 'twitter', caption: 'B' },
      ],
      reasoning: 'Adapté longitud por red',
    })
    expect(result.success).toBe(true)
  })
})

describe('ImageGenerationInputSchema', () => {
  it('aspectRatio default es 1:1', () => {
    const result = ImageGenerationInputSchema.parse({
      prompt: 'Pizza margherita en mesa de mármol',
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.aspectRatio).toBe('1:1')
    expect(result.count).toBe(1)
  })

  it('count limitado a 1-4', () => {
    expect(
      ImageGenerationInputSchema.safeParse({
        prompt: 'X',
        brandKitId: '550e8400-e29b-41d4-a716-446655440000',
        count: 0,
      }).success,
    ).toBe(false)
    expect(
      ImageGenerationInputSchema.safeParse({
        prompt: 'Pizza margherita rica',
        brandKitId: '550e8400-e29b-41d4-a716-446655440000',
        count: 5,
      }).success,
    ).toBe(false)
  })
})

describe('SocialPlatformSchema', () => {
  it('acepta plataformas conocidas', () => {
    expect(SocialPlatformSchema.safeParse('instagram').success).toBe(true)
    expect(SocialPlatformSchema.safeParse('threads').success).toBe(true)
  })

  it('rechaza plataformas desconocidas', () => {
    expect(SocialPlatformSchema.safeParse('myspace').success).toBe(false)
  })
})
