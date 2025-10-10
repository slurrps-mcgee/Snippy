#!/bin/sh
# entrypoint.sh - write runtime config for Angular and then start nginx

set -e

ASSETS_PATH="/usr/share/nginx/html/assets"
CONFIG_FILE="$ASSETS_PATH/appsettings.json"
ENV_JS_FILE="$ASSETS_PATH/env.js"

# Ensure assets dir exists
mkdir -p "$ASSETS_PATH"

cat > "$CONFIG_FILE" <<EOF
{
  "api_base": "${API_BASE:-/api/v1}",
  "auth0_domain": "${AUTH0_DOMAIN:-}",
  "auth0_client_id": "${AUTH0_CLIENT_ID:-}"
}
EOF

echo "Wrote runtime config to $CONFIG_FILE"

# Also write a small env.js that sets window.__env for scripts that expect it
cat > "$ENV_JS_FILE" <<EOF
window.__env = window.__env || {};
window.__env.api_base = "${API_BASE:-/api/v1}";
window.__env.auth0_domain = "${AUTH0_DOMAIN:-}";
window.__env.auth0_client_id = "${AUTH0_CLIENT_ID:-}";
EOF

echo "Wrote runtime env to $ENV_JS_FILE"

# Exec the container CMD (nginx)
exec "$@"
