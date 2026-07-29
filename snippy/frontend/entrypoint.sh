#!/bin/sh
set -e

HTML_ROOT="/usr/share/nginx/html"
ASSETS_PATH="$HTML_ROOT/assets"
CONFIG_FILE="$ASSETS_PATH/appsettings.json"
ENV_JS_FILE="$HTML_ROOT/env.js"

mkdir -p "$ASSETS_PATH"

if [ "${ENABLE_MINIO}" = "true" ]; then
  MINIO_ENABLED=true
else
  MINIO_ENABLED=false
fi

cat > "$CONFIG_FILE" <<EOF
{
  "api_base": "${API_BASE:-/api/v1}",
  "auth0_domain": "${AUTH0_DOMAIN:-}",
  "auth0_client_id": "${AUTH0_CLIENT_ID:-}",
  "auth0_audience": "${AUTH0_AUDIENCE:-http://localhost:3000}",
  "minio_enabled": ${MINIO_ENABLED}
}
EOF
echo "Wrote runtime config to $CONFIG_FILE"

cat > "$ENV_JS_FILE" <<EOF
window.__env = window.__env || {};
window.__env.api_base = "${API_BASE:-/api/v1}";
window.__env.auth0_domain = "${AUTH0_DOMAIN:-}";
window.__env.auth0_client_id = "${AUTH0_CLIENT_ID:-}";
window.__env.auth0_audience = "${AUTH0_AUDIENCE:-http://localhost:3000}";
window.__env.minio_enabled = ${MINIO_ENABLED};
EOF
echo "Wrote runtime env to $ENV_JS_FILE"

# --- NGINX config selection logic ---
if [ "${ENABLE_MINIO}" = "true" ]; then
  echo "MinIO enabled, waiting for it to be ready..."
  RETRIES=15
  MINIO_FOUND=false
  
  while [ $RETRIES -gt 0 ]; do
    if curl -sf --connect-timeout 2 "http://minio:9000/minio/health/live" >/dev/null 2>&1; then
      echo "✅ MinIO is reachable, using nginx.minio.conf"
      echo "window.__env.minio_enabled = true;" >> "$ENV_JS_FILE"
      cp /etc/nginx/nginx.minio.conf /etc/nginx/conf.d/default.conf
      MINIO_FOUND=true
      break
    fi
    RETRIES=$((RETRIES - 1))
    echo "MinIO not ready, retrying... ($RETRIES left)"
    sleep 2
  done
  
  if [ "$MINIO_FOUND" = "false" ]; then
    echo "⚠️ MinIO not reachable, using nginx.nominio.conf"
    echo "window.__env.minio_enabled = false;" >> "$ENV_JS_FILE"
    cp /etc/nginx/nginx.nominio.conf /etc/nginx/conf.d/default.conf
  fi
else
  echo "MinIO disabled, using nginx.nominio.conf"
  echo "window.__env.minio_enabled = false;" >> "$ENV_JS_FILE"
  cp /etc/nginx/nginx.nominio.conf /etc/nginx/conf.d/default.conf
fi

exec "$@"
