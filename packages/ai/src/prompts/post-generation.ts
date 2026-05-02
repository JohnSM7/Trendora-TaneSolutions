import type { PostGenerationInput } from '../schemas'

/**
 * Prompt de usuario para generar posts. El system prompt ya contiene la marca.
 *
 * @version 1.0.0
 */
export function postGenerationPrompt(input: PostGenerationInput): string {
  return `# Tarea

Genera un post optimizado para cada plataforma indicada, sobre el tema:

> ${input.topic}

# Plataformas

${input.platforms.map((p) => `- ${p}`).join('\n')}

# Configuración

- Longitud objetivo: ${input.length}
- Tono: ${input.tone ?? 'usa el por defecto del brand kit'}
- Incluir hashtags: ${input.includeHashtags ? 'sí' : 'no'}
- Incluir CTA: ${input.includeCta ? 'sí' : 'no'}

# Output esperado

JSON con esta forma exacta:

\`\`\`json
{
  "posts": [
    {
      "platform": "instagram",
      "caption": "...",
      "hashtags": ["..."],
      "cta": "...",
      "altText": "...",
      "imagePrompt": "Descripción detallada para generar imagen acompañante",
      "bestTimeHint": "Martes 13:00 (ejemplo)"
    }
  ],
  "reasoning": "Por qué estas decisiones (1-2 frases)"
}
\`\`\`

Adapta el caption específicamente a cada plataforma — no copies el mismo texto. Cada plataforma tiene su público y formato propio.`
}
