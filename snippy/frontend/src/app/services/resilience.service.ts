import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleWhen,
  circuitBreaker,
  wrap,
} from 'cockatiel';

/** Retry / break only on network failures and HTTP 5xx — not on 4xx. */
function isRetriableError(err: unknown): boolean {
  const anyErr = err as any;
  const status: number | undefined =
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.response?.status ??
    anyErr?.error?.status;

  if (typeof status === 'number') {
    return status >= 500 && status < 600;
  }

  // HttpClient network errors often have status 0 or no status
  if (status === 0) return true;
  if (anyErr?.name === 'TimeoutError') return true;
  if (typeof status !== 'number' && anyErr instanceof Error) return true;

  return false;
}

function isMinioRetriableError(err: unknown): boolean {
  const anyErr = err as any;
  const status: number | undefined =
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.response?.status ??
    anyErr?.error?.status;
  // 503 means MinIO is latched off — retrying only delays save / upload.
  if (status === 503) return false;
  return isRetriableError(err);
}

function createHttpPolicy(retriable: (err: unknown) => boolean = isRetriableError) {
  const retryPolicy = retry(handleWhen(retriable), {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 5_000 }),
  });

  const breakerPolicy = circuitBreaker(handleWhen(retriable), {
    halfOpenAfter: 10 * 1000,
    breaker: new ConsecutiveBreaker(5),
  });

  return wrap(breakerPolicy, retryPolicy);
}

/** Snippet / user / collection JSON API. */
const defaultPolicy = createHttpPolicy();

/** MinIO-backed routes — separate circuit so 503s do not trip CRUD. */
const minioPolicy = createHttpPolicy(isMinioRetriableError);

export { defaultPolicy, minioPolicy };
export type HttpResiliencePolicy = typeof defaultPolicy;
