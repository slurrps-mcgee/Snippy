#!/bin/sh
# Local development only — writes public/env.js before ng serve. Not used in production.
set -e

PUBLIC_PATH="/app/public"
ENV_JS_FILE="$PUBLIC_PATH/env.js"

mkdir -p "$PUBLIC_PATH"

if [ "${ENABLE_MINIO}" = "true" ]; then
  MINIO_ENABLED=true
else
  MINIO_ENABLED=false
fi

cat > "$ENV_JS_FILE" <<EOF
window.__env = {
  api_base: "${API_BASE:-/api/v1}",
  auth0_domain: "${AUTH0_DOMAIN:-}",
  auth0_client_id: "${AUTH0_CLIENT_ID:-}",
  auth0_audience: "${AUTH0_AUDIENCE:-http://localhost:3000}",
  minio_enabled: ${MINIO_ENABLED}
};
EOF

echo "Wrote runtime env to $ENV_JS_FILE"

cat "$ENV_JS_FILE"

if [ -z "${AUTH0_DOMAIN:-}" ] || [ -z "${AUTH0_CLIENT_ID:-}" ]; then
  echo "WARNING: AUTH0_DOMAIN or AUTH0_CLIENT_ID is empty. Auth0 login will not work."
fi

exec "$@"
