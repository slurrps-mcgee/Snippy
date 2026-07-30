#!/bin/sh
# Local development only — writes public/env.js before ng serve. Not used in production.
set -e

js_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/	/\\t/g'
}

PUBLIC_PATH="/app/public"
ENV_JS_FILE="$PUBLIC_PATH/env.js"

mkdir -p "$PUBLIC_PATH"

if [ "${ENABLE_MINIO}" = "true" ]; then
  MINIO_ENABLED=true
else
  MINIO_ENABLED=false
fi

API_BASE_ESC=$(js_escape "${API_BASE:-/api/v1}")
AUTH0_DOMAIN_ESC=$(js_escape "${AUTH0_DOMAIN:-}")
AUTH0_CLIENT_ID_ESC=$(js_escape "${AUTH0_CLIENT_ID:-}")
AUTH0_AUDIENCE_ESC=$(js_escape "${AUTH0_AUDIENCE:-http://localhost:3000}")

cat > "$ENV_JS_FILE" <<EOF
window.__env = {
  api_base: "${API_BASE_ESC}",
  auth0_domain: "${AUTH0_DOMAIN_ESC}",
  auth0_client_id: "${AUTH0_CLIENT_ID_ESC}",
  auth0_audience: "${AUTH0_AUDIENCE_ESC}",
  minio_enabled: ${MINIO_ENABLED}
};
EOF

echo "Wrote runtime env to $ENV_JS_FILE"
cat "$ENV_JS_FILE"

if [ -z "${AUTH0_DOMAIN:-}" ] || [ -z "${AUTH0_CLIENT_ID:-}" ]; then
  echo "WARNING: AUTH0_DOMAIN or AUTH0_CLIENT_ID is empty. Auth0 login will not work."
fi

exec "$@"
