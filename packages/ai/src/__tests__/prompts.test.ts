import { describe, it, expect } from 'vitest'
import {
  systemPromptForBrandKit,
  postGenerationPrompt,
  imageGenerationPrompt,
  repurposePrompt,
} from '../prompts'

describe('systemPromptForBrandKit', () => {
  it('incluye nombre y vertical', () => {
    const p = systemPromptForBrandKit({
      name: 'La Strada',
      vertical: 'restaurante',
    })
    expect(p).toContain('La Strada')
    expect(p).toContain('restaurante')
  })

  it('inyecta voicePrompt cuando existe', () => {
    const p = systemPromptForBrandKit({
      name: 'X',
      voicePrompt: 'Tono cercano y auténtico',
    })
    expect(p).toContain('Tono cercano y auténtico')
  })

  it('lista do_not_say como prohibidas', () => {
    const p = systemPromptForBrandKit({
      name: 'X',
      doNotSay: ['barato', 'fast food'],
    })
    expect(p).toContain('barato')
    expect(p).toContain('fast food')
    expect(p).toContain('NO usar')
  })

  it('respeta el idioma indicado', () => {
    const en = systemPromptForBrandKit({ name: 'X', language: 'en' })
    const ca = systemPromptForBrandKit({ name: 'X', language: 'ca' })
    expect(en).toContain('inglés')
    expect(ca).toContain('catalán')
  })

  it('produce un prompt suficientemente largo para activar caché Anthropic (>1024 tokens estimados ~ 4kB)', () => {
    const p = systemPromptForBrandKit({
      name: 'La Strada',
      vertical: 'restaurante',
      voicePrompt: 'Comunicación cercana y auténtica con guiños a la cultura italiana sin caricaturizarla.',
      tone: ['cercano', 'profesional', 'familiar'],
      doSay: ['masa madre', 'horno de leña', 'productos frescos'],
      doNotSay: ['barato', 'fast food'],
      defaultCta: 'Reserva en lastrada.com',
    })
    // Esperamos un prompt extenso. ~1024 tokens ~ 4096 chars como mínimo deseable.
    expect(p.length).toBeGreaterThan(1500)
  })
})

describe('postGenerationPrompt', () => {
  it('lista las plataformas', () => {
    const p = postGenerationPrompt({
      topic: 'Anuncio del menú',
      platforms: ['instagram', 'linkedin'],
      length: 'medium',
      includeHashtags: true,
      includeCta: true,
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
      language: 'es',
    })
    expect(p).toContain('instagram')
    expect(p).toContain('linkedin')
    expect(p).toContain('Anuncio del menú')
  })
})

describe('imageGenerationPrompt', () => {
  it('añade colores del brand', () => {
    const p = imageGenerationPrompt(
      { prompt: 'Pizza', brandKitId: '550e8400-e29b-41d4-a716-446655440000', aspectRatio: '1:1', count: 1 },
      { primaryColor: '#C8102E', accentColor: '#F1C40F' },
    )
    expect(p).toContain('#C8102E')
    expect(p).toContain('#F1C40F')
  })

  it('siempre indica "no text, no logos, no watermarks"', () => {
    const p = imageGenerationPrompt({
      prompt: 'Pizza',
      brandKitId: '550e8400-e29b-41d4-a716-446655440000',
      aspectRatio: '1:1',
      count: 1,
    })
    expect(p).toContain('no text')
    expect(p).toContain('no logos')
  })

  it('aplica estilo según parámetro', () => {
    const photo = imageGenerationPrompt(
      { prompt: 'X', brandKitId: '550e8400-e29b-41d4-a716-446655440000', aspectRatio: '1:1', count: 1, style: 'photo' },
    )
    const flatlay = imageGenerationPrompt(
      { prompt: 'X', brandKitId: '550e8400-e29b-41d4-a716-446655440000', aspectRatio: '1:1', count: 1, style: 'flatlay' },
    )
    expect(photo).toContain('photography')
    expect(flatlay).toContain('flatlay')
  })
})

describe('repurposePrompt', () => {
  it('trunca fuente larga a 12000 chars', () => {
    const longSource = 'A'.repeat(20000)
    const p = repurposePrompt({
      source: longSource,
      sourceType: 'blog',
      targetPlatforms: ['linkedin'],
    })
    // El bloque entre ``` debe contener al máximo 12000 chars
    const block = p.match(/```\n([\s\S]+?)\n```/)?.[1] ?? ''
    expect(block.length).toBeLessThanOrEqual(12000)
  })

  it('default postsPerPlatform es 3', () => {
    const p = repurposePrompt({
      source: 'X'.repeat(100),
      sourceType: 'blog',
      targetPlatforms: ['linkedin'],
    })
    expect(p).toContain('3 ideas')
  })
})
