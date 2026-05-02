/**
 * Prompt para repurposing: convertir contenido largo en posts cortos.
 *
 * @version 1.0.0
 */
export function repurposePrompt(args: {
  source: string
  sourceType: 'blog' | 'transcript' | 'newsletter' | 'video'
  targetPlatforms: string[]
  postsPerPlatform?: number
}): string {
  return `# Tarea de repurposing

Tomas el siguiente contenido fuente (tipo: ${args.sourceType}) y lo conviertes en piezas adaptadas para redes sociales.

# Fuente

\`\`\`
${args.source.slice(0, 12000)}
\`\`\`

# Plataformas destino

${args.targetPlatforms.map((p) => `- ${p}`).join('\n')}

# Reglas

- Extrae las ${args.postsPerPlatform ?? 3} ideas más valiosas y autocontenidas por plataforma.
- Cada pieza debe poder leerse SIN haber leído la fuente.
- Mantén la voz y tono del brand kit del system prompt.
- Para LinkedIn: estructura tipo "hook → desarrollo en 3 puntos → reflexión → CTA".
- Para Twitter/X: hilos cortos numerados solo si la idea lo justifica.
- Para Instagram: carrusel-friendly (5-7 slides imaginables) o post potente.

# Output JSON

\`\`\`json
{
  "posts": [
    { "platform": "...", "caption": "...", "hashtags": [...], "imagePrompt": "..." }
  ]
}
\`\`\``
}
