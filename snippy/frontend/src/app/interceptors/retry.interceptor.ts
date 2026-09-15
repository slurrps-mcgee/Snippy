import type { HttpInterceptorFn } from '@angular/common/http';
import { defer, from, lastValueFrom } from 'rxjs';
import { defaultPolicy, minioPolicy } from '../services/resilience.service';

function isMinioUrl(url: string, method: string): boolean {
  const m = method.toUpperCase();
  if (url.includes('/api/v1/assets')) return true;
  if (m === 'POST' && url.includes('/api/v1/users/picture')) return true;
  if (m === 'POST' && /\/api\/v1\/snippets\/[^/]+\/snapshot/.test(url)) return true;
  return false;
}

/**
 * Retry / circuit-break /api/v1 calls (5xx and network errors only).
 *
 * Generated clients use `HttpClient.request(HttpRequest)`, which emits
 * `HttpEvent`s (`Sent`, then `Response`). `firstValueFrom` would take `Sent`
 * and unsubscribe, which aborts the XHR (Firefox `NS_BINDING_ABORTED`).
 */
export const retryInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.includes('/api/v1')) {
    return next(request);
  }
  if (isMinioUrl(request.url, request.method)) {
    return next(request);
  }

  return defer(() => from(defaultPolicy.execute(() => lastValueFrom(next(request.clone())))));
};

/** MinIO-backed routes: no retry on 503 (latched off). */
export const minioRetryInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isMinioUrl(request.url, request.method)) {
    return next(request);
  }

  return defer(() => from(minioPolicy.execute(() => lastValueFrom(next(request.clone())))));
};
