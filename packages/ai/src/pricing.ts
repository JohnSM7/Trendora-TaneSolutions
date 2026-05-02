/**
 * Tabla de costes y conversión a créditos.
 *
 * 1 crédito ≈ $0.012 de coste interno.
 * El precio de venta de los packs cubre el coste y deja margen.
 */

export const MODEL_PRICING = {
  // USD por 1M tokens — actualizar trimestralmente. IDs reales de cada provider.
  'claude-3-5-sonnet-latest': { input: 3.0, output: 15.0, cachedInput: 0.3 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4.0, cachedInput: 0.08 },
  'claude-opus-4-7': { input: 15.0, output: 75.0, cachedInput: 1.5 },
  'gpt-4o': { input: 2.5, output: 10.0, cachedInput: 1.25 },
  'gpt-4o-mini': { input: 0.15, output: 0.6, cachedInput: 0.075 },
  'gemini-1.5-pro-latest': { input: 1.25, output: 5.0, cachedInput: 0.3125 },
  'gemini-1.5-flash-latest': { input: 0.075, output: 0.3, cachedInput: 0.01875 },
  'gemini-2-5-pro': { input: 2.5, output: 10.0, cachedInput: 0.25 },
  'gpt-5': { input: 5.0, output: 20.0, cachedInput: 0.5 },
} as const

export const IMAGE_PRICING_USD = {
  'nano-banana': 0.04,           // por imagen
  'flux-pro': 0.05,
  'flux-schnell': 0.003,
  'sd3-large': 0.035,
} as const

export const VIDEO_PRICING_USD = {
  'veo-3': 0.5,                  // por segundo (estimado)
  'sora-2': 0.1,                 // por segundo
  'runway-gen-4': 0.3,
} as const

/** Convierte coste en USD a créditos cobrados al cliente. */
export function costToCredits(costUsd: number): number {
  // 1 crédito = $0.012 → margen ~ 4x
  return Math.max(1, Math.ceil(costUsd / 0.003))
}

export function calculateTextCost(
  model: keyof typeof MODEL_PRICING,
  tokensIn: number,
  tokensOut: number,
  cachedTokensIn = 0,
): number {
  const p = MODEL_PRICING[model]
  const freshIn = tokensIn - cachedTokensIn
  return (
    (freshIn / 1_000_000) * p.input +
    (cachedTokensIn / 1_000_000) * p.cachedInput +
    (tokensOut / 1_000_000) * p.output
  )
}
