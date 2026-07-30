export interface RuntimeEnv {
  api_base: string;
  auth0_domain: string;
  auth0_client_id: string;
  auth0_audience: string;
  minio_enabled: boolean;
}

declare global {
  interface Window {
    __env?: Partial<RuntimeEnv>;
  }
}

const DEFAULTS: RuntimeEnv = {
  api_base: '/api/v1',
  auth0_domain: '',
  auth0_client_id: '',
  auth0_audience: 'http://localhost:3000',
  minio_enabled: false,
};

/**
 * Typed access to container-injected `window.__env` (from /env.js).
 * Auth0 fields must be present at bootstrap for login to work.
 */
export function getRuntimeEnv(): RuntimeEnv {
  const raw = (typeof window !== 'undefined' ? window.__env : undefined) ?? {};
  return {
    api_base: (raw.api_base || DEFAULTS.api_base).replace(/\/$/, ''),
    auth0_domain: raw.auth0_domain ?? DEFAULTS.auth0_domain,
    auth0_client_id: raw.auth0_client_id ?? DEFAULTS.auth0_client_id,
    auth0_audience: raw.auth0_audience ?? DEFAULTS.auth0_audience,
    minio_enabled: Boolean(raw.minio_enabled),
  };
}

export function assertAuth0Env(env: RuntimeEnv = getRuntimeEnv()): void {
  if (!env.auth0_domain || !env.auth0_client_id) {
    console.error(
      '[Snippy] Missing AUTH0_DOMAIN / AUTH0_CLIENT_ID in /env.js. Auth0 login will not work.'
    );
  }
}
