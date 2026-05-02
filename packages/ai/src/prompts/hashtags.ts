/**
 * Prompt para generación de hashtags optimizados.
 * Versión 1.0.0
 */
export function hashtagsPrompt(args: {
  topic: string
  platform: 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'pinterest' | 'threads'
  count?: number
  location?: string
  language?: 'es' | 'en' | 'ca'
}): string {
  const count = args.count ?? 12
  const platformGuidance: Record<string, string> = {
    instagram: 'Mezcla 20% volumen alto (>1M), 50% medio (100k-1M), 30% nicho (<100k). Hashtags geográficos si aplica.',
    tiktok: '5-7 hashtags, mezcla trends del momento + hashtags evergreen del nicho.',
    twitter: 'Solo 1-3 hashtags, muy específicos. NO sobrecargar.',
    linkedin: '3-5 hashtags profesionales, evitar emojis. Sectoriales > genéricos.',
    pinterest: 'Hasta 20, orientados a búsqueda (no trends). Palabras concretas que la gente busca.',
    threads: '3-5 hashtags, similar a Twitter pero con más espacio.',
  }

  return `# Tarea

Genera ${count} hashtags optimizados para **${args.platform}** sobre el tema:

> ${args.topic}

${args.location ? `Ubicación: ${args.location} (incluye hashtags geográficos relevantes).` : ''}

# Reglas para ${args.platform}

${platformGuidance[args.platform]}

# Reglas generales

- En ${args.language === 'en' ? 'inglés' : args.language === 'ca' ? 'catalán' : 'español'}.
- Sin almohadilla en el output (devuelve "pizza" no "#pizza").
- Sin espacios ni emojis.
- Cada uno justificado: para qué sirve y a quién captura.

# Output JSON

\`\`\`json
{
  "hashtags": [
    {
      "tag": "pizzaartesanal",
      "volume": "medium",
      "intent": "discovery",
      "reasoning": "Captura usuarios buscando alternativas a cadenas"
    }
  ],
  "bestTime": "Ej: Martes 13:00 (descripción breve de por qué)",
  "tips": ["Tip 1 específico para esta plataforma", "..."]
}
\`\`\``
}
