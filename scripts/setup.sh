#!/usr/bin/env bash
# Setup inicial del proyecto.
# Uso: bash scripts/setup.sh

set -euo pipefail

echo "🌱 Trendora — setup inicial"
echo

# 1. Verificar herramientas
command -v pnpm >/dev/null || { echo "❌ pnpm no instalado. https://pnpm.io"; exit 1; }
command -v node >/dev/null || { echo "❌ node no instalado. Necesitas v22+"; exit 1; }

# 2. .env
if [[ ! -f .env ]]; then
  echo "📝 Copiando .env.example → .env"
  cp .env.example .env
  echo "⚠️  Edita .env con tus credenciales reales antes de continuar"
fi

# 3. Dependencias
echo "📦 Instalando dependencias…"
pnpm install

# 4. Supabase local (opcional)
if command -v supabase >/dev/null; then
  echo "🐘 Supabase CLI detectado. Para arrancar local:"
  echo "   cd packages/db && supabase start"
else
  echo "ℹ️  Supabase CLI no detectado. Instalar con:"
  echo "   pnpm add -g supabase"
fi

echo
echo "✅ Setup completado."
echo
echo "Siguientes pasos:"
echo "  1. Edita .env con tus credenciales"
echo "  2. cd packages/db && supabase start  # arranca DB local"
echo "  3. pnpm dev                          # arranca todas las apps"
echo
echo "URLs en dev:"
echo "  Marketing:  http://localhost:4321"
echo "  Dashboard:  http://localhost:3000"
echo "  Supabase:   http://localhost:54323"
