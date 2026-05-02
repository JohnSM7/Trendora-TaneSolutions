/**
 * Prompts versionados.
 *
 * Cada prompt expone un `id` y `version` que persistimos en `generations.metadata`
 * para reproducibilidad. Si cambia el prompt, sube la versión.
 */
export { systemPromptForBrandKit, type BrandKitContext } from './system'
export { postGenerationPrompt } from './post-generation'
export { imageGenerationPrompt } from './image-generation'
export { repurposePrompt } from './repurpose'
export { hashtagsPrompt } from './hashtags'
