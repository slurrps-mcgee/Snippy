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

const retryPolicy = retry(handleWhen(isRetriableError), {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 5_000 }),
});

const breakerPolicy = circuitBreaker(handleWhen(isRetriableError), {
  halfOpenAfter: 10 * 1000,
  breaker: new ConsecutiveBreaker(5),
});

const defaultPolicy = wrap(breakerPolicy, retryPolicy);

export { defaultPolicy };
