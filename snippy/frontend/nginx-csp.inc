# Document CSP. Requires $csp_frame_ancestors in this location
# ('self' for the app, * for /embed/). Do not include from /api/ or /content/.
#
# Extra sources vs a strict default:
# - script-src/style-src https: — snippet CDN libraries load inside srcdoc previews
# - img-src data: blob: https: — assets, avatars, data-URL snapshots
# - font-src https: data: — CDN stylesheets often @font-face from the same host
# - connect-src blob: data: — html-to-image / fetch(dataUrl) snapshot capture
# - Auth0 region wildcards — silent auth iframe + token endpoints
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' https: data:; connect-src 'self' blob: data: https://*.auth0.com https://*.us.auth0.com https://*.eu.auth0.com https://*.au.auth0.com; frame-src 'self' blob: https://*.auth0.com https://*.us.auth0.com https://*.eu.auth0.com https://*.au.auth0.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors $csp_frame_ancestors" always;
