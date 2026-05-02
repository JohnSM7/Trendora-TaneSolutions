#!/usr/bin/env bash
# Verifica que las variables de entorno críticas estén definidas.
# Uso: bash scripts/check-env.sh [.env.path]

set -euo pipefail

ENV_FILE="${1:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No existe $ENV_FILE"
  exit 1
fi

REQUIRED=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "REPLICATE_API_TOKEN"
  "AYRSHARE_API_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "RESEND_API_KEY"
  "INNGEST_EVENT_KEY"
  "NUXT_SESSION_PASSWORD"
)

MISSING=()
set +e
for var in "${REQUIRED[@]}"; do
  value=$(grep -E "^${var}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [[ -z "$value" || "$value" == *"..."* || "$value" == "cambia_esto"* ]]; then
    MISSING+=("$var")
  fi
done
set -e

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ Variables de entorno faltantes o sin definir en $ENV_FILE:"
  printf '   - %s\n' "${MISSING[@]}"
  exit 1
fi

echo "✅ Todas las variables críticas están definidas en $ENV_FILE"
