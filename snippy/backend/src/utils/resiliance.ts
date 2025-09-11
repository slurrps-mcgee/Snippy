import { ConsecutiveBreaker, ExponentialBackoff, retry, handleAll, circuitBreaker, wrap } from 'cockatiel';

const retryPolicly = retry(handleAll, {
  maxAttempts: 15,
  backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 10_000 }),
});

const breakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new ConsecutiveBreaker(5),
});

const defaultPolicy = wrap(breakerPolicy, retryPolicly);

export { defaultPolicy };