export type TextProvider = 'anthropic' | 'openai' | 'google'

export type ImageProvider =
  | 'gemini-nano-banana'
  | 'openai-dalle-3'
  | 'replicate-nano-banana'
  | 'replicate-flux-pro'
  | 'replicate-flux-schnell'

export interface GenerationResult<T> {
  data: T
  usage: {
    tokensIn: number
    tokensOut: number
    cachedTokensIn?: number
    durationMs: number
  }
  costUsd: number
  model: string
  provider: string
}
