#!/usr/bin/env bash
# One-shot: show Vercel status, push OpenAI env from .env.local, redeploy production.
# Safe: never prints secret values.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1 && [[ ! -x ./node_modules/.bin/vercel ]]; then
  echo "Installing vercel CLI locally…"
  npm install -D vercel >/dev/null
fi
VC=(npx vercel)
[[ -x ./node_modules/.bin/vercel ]] && VC=(./node_modules/.bin/vercel)

echo "== Whoami =="
"${VC[@]}" whoami

echo ""
echo "== Recent deployments =="
"${VC[@]}" ls

echo ""
echo "== Env var names (values hidden) =="
"${VC[@]}" env ls

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — add OPENAI_API_KEY first."
  exit 1
fi

OPENAI_API_KEY="$(grep -E '^OPENAI_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//;s/["'\'']$//')"
OPENAI_MODEL="$(grep -E '^OPENAI_MODEL=' .env.local | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//;s/["'\'']$//')"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4o}"

if [[ -z "$OPENAI_API_KEY" || "$OPENAI_API_KEY" != sk-* ]]; then
  echo "OPENAI_API_KEY missing or invalid in .env.local"
  exit 1
fi

add_env() {
  local name="$1"
  local value="$2"
  local target="$3"
  # Remove existing (ignore missing)
  "${VC[@]}" env rm "$name" "$target" -y >/dev/null 2>&1 || true
  printf '%s' "$value" | "${VC[@]}" env add "$name" "$target"
}

echo ""
echo "== Adding OPENAI_API_KEY + OPENAI_MODEL (one env at a time) =="
for target in production preview development; do
  echo "-- $target"
  add_env OPENAI_API_KEY "$OPENAI_API_KEY" "$target"
  add_env OPENAI_MODEL "$OPENAI_MODEL" "$target"
done

echo ""
echo "== Env after update =="
"${VC[@]}" env ls

echo ""
echo "== Production redeploy =="
"${VC[@]}" --prod --yes

echo ""
echo "Done. Open https://bite-family.vercel.app and hard-refresh."
