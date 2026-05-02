# ADR 006 — Vercel AI SDK v5 para orquestación IA

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Necesitamos orquestar llamadas a múltiples modelos:
- **Claude 4.7 Sonnet** (texto principal)
- **GPT-5** o **Gemini 2.5 Pro** (fallback)
- **Replicate** (Nano Banana, Flux, otros)
- **Veo 3** (vídeo, fase 2)

Requisitos: streaming a UI, prompt caching, structured output con Zod, tool calling.

## Opciones consideradas

| Opción | Streaming | Multi-provider | DX Vue/Nuxt | Madurez |
|---|---|---|---|---|
| **Vercel AI SDK v5** | Excelente | Sí, unificado | Composable `useChat` Vue | Estable |
| LangChain.js | Sí | Sí | Bueno pero pesado | Estable |
| SDKs nativos directos | Manual | No | Manual | N/A |
| Mastra | Agentic framework potente | Sí | Bueno | Joven |
| LlamaIndex.ts | Foco RAG | Sí | Medio | Estable |

## Decisión

**Vercel AI SDK v5** + SDKs nativos cuando AI SDK no cubra (ej. Replicate prediction polling).

### Patrón de uso

```typescript
// apps/app/server/api/ai/generate-post.post.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const Body = z.object({
  topic: z.string().min(3),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'])),
  brandKitId: z.string().uuid(),
  tone: z.enum(['professional', 'casual', 'playful']).optional(),
})

export default defineEventHandler(async (event) => {
  const { user, org } = await requireOrgMember(event)
  const body = await readValidatedBody(event, Body.parse)

  const brandKit = await loadBrandKit(body.brandKitId, org.id)

  const result = streamText({
    model: anthropic('claude-sonnet-4-6', {
      cacheControl: true, // prompt caching
    }),
    system: buildSystemPrompt(brandKit),
    prompt: buildUserPrompt(body),
    maxTokens: 2000,
    onFinish: async ({ usage }) => {
      await trackGeneration({
        orgId: org.id,
        userId: user.id,
        type: 'text',
        model: 'claude-sonnet-4-6',
        tokensIn: usage.promptTokens,
        tokensOut: usage.completionTokens,
        costUsd: calculateCost(usage),
      })
    },
  })

  return result.toDataStreamResponse()
})
```

En el frontend Nuxt:

```vue
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/ai/generate-post',
})
</script>
```

## Consecuencias

✅ Streaming UI desde el día 1
✅ Cambiar de Claude a GPT a Gemini = 1 línea de código
✅ Prompt caching ahorra ~70% en prompts largos repetidos (brand kit)
✅ Tool calling estandarizado para futuros agentes
⚠️ La API del SDK evoluciona rápido, hay que pin y leer changelog en cada upgrade
