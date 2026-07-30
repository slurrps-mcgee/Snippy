#!/bin/sh
set -e

# Escape a value for use inside a double-quoted JavaScript string
js_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/	/\\t/g'
}

HTML_ROOT="/usr/share/nginx/html"
ENV_JS_FILE="$HTML_ROOT/env.js"

mkdir -p "$HTML_ROOT"

MINIO_ENABLED=false
NGINX_CONF=/etc/nginx/nginx.nominio.conf

if [ "${ENABLE_MINIO}" = "true" ]; then
  echo "MinIO enabled, waiting for it to be ready..."
  RETRIES=15

  while [ $RETRIES -gt 0 ]; do
    if curl -sf --connect-timeout 2 "http://minio:9000/minio/health/live" >/dev/null 2>&1; then
      echo "MinIO is reachable, using nginx.minio.conf"
      MINIO_ENABLED=true
      NGINX_CONF=/etc/nginx/nginx.minio.conf
      break
    fi
    RETRIES=$((RETRIES - 1))
    echo "MinIO not ready, retrying... ($RETRIES left)"
    sleep 2
  done

  if [ "$MINIO_ENABLED" = "false" ]; then
    echo "WARNING: MinIO not reachable, using nginx.nominio.conf"
  fi
else
  echo "MinIO disabled, using nginx.nominio.conf"
fi

cp "$NGINX_CONF" /etc/nginx/conf.d/default.conf

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

exec "$@"
