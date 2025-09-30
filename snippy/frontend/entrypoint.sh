#!/bin/sh
set -e

TARGET=/usr/share/nginx/html/assets/env.js

mkdir -p $(dirname "$TARGET")

echo "Generating runtime env at $TARGET"
cat > "$TARGET" <<EOF
(function (window) {
  window.API_BASE = "${API_BASE:-http://api:3000/api/v1}";
  window.FRONTEND_ORIGIN = "${FRONTEND_ORIGIN:-http://localhost:4200}";
})(this);
EOF

# exec the container CMD (nginx)
exec "$@"
