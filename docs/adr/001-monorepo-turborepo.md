# ADR 001 — Monorepo con Turborepo + pnpm workspaces

- **Estado**: Aceptado
- **Fecha**: 2026-04-25

## Contexto

Trendora tiene dos apps (marketing site + dashboard) que comparten tipos de DB, componentes UI, configuración y wrappers IA. Queremos:
- Compartir código sin publicar paquetes npm
- Una sola fuente de verdad para tipos
- Builds incrementales rápidos
- DX cercano al de un proyecto único

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Turborepo + pnpm** | Caché remoto Vercel, simple, sin opiniones, 2024+ maduro | Requiere disciplina en configuración |
| Nx | Generadores potentes, plugin oficial Nuxt | Curva más alta, prescriptivo |
| Polyrepo (2 repos) | Aislamiento total | Duplicación tipos, sincronización manual |
| Lerna + npm workspaces | Maduro | Lerna en mantenimiento, npm más lento que pnpm |

## Decisión

**Turborepo + pnpm workspaces.**

Estructura:
```
apps/
  web/        Astro 5 (marketing)
  app/        Nuxt 4 (dashboard SaaS)
packages/
  db/         Schema + cliente Supabase + tipos generados
  ui/         Componentes Vue compartidos (shadcn-vue)
  config/     Configuración compartida (eslint, tsconfig, tailwind)
  ai/         Wrappers de IA (Claude, Replicate) + prompts
```

## Consecuencias

✅ Tipos de DB importables desde ambas apps con `@tane/db`
✅ Caché remoto en Vercel acelera CI tras primer build
✅ pnpm minimiza espacio en disco (10x menos que npm)
⚠️ Hay que mantener `tsconfig` paths sincronizados
⚠️ Vercel project config requiere `Root Directory` por app
