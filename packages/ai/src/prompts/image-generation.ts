import type { ImageGenerationInput } from '../schemas'

/**
 * Construye un prompt enriquecido para Replicate / modelos de imagen.
 *
 * @version 1.0.0
 */
export function imageGenerationPrompt(
  input: ImageGenerationInput,
  brandHints: { primaryColor?: string | null; accentColor?: string | null } = {},
): string {
  const styleMap: Record<string, string> = {
    photo: 'professional photography, natural lighting, shallow depth of field, magazine-quality',
    illustration: 'modern flat illustration, clean lines, minimal palette',
    flatlay: 'overhead flatlay, neutral background, well-organized composition',
    lifestyle: 'lifestyle photography, candid moment, warm natural light, real people',
    product: 'product photography, white background, sharp detail, commercial quality',
  }

  const palette = [brandHints.primaryColor, brandHints.accentColor].filter(Boolean).join(' and ')

  const parts = [
    input.prompt,
    input.style ? styleMap[input.style] : styleMap.photo,
    palette ? `subtle color accents in ${palette}` : '',
    'no text, no logos, no watermarks',
    'high resolution, sharp focus',
  ].filter(Boolean)

  return parts.join(', ')
}
