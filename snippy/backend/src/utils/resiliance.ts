import { ConsecutiveBreaker, ExponentialBackoff, retry, handleAll, circuitBreaker, wrap, handleType } from 'cockatiel';

// Default policy for general database operations, network calls, etc.
const retryPolicly = retry(handleAll, {
  maxAttempts: 15,
  backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 10_000 }),
});

const breakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 10 * 1000,
  breaker: new ConsecutiveBreaker(5),
});

const defaultPolicy = wrap(breakerPolicy, retryPolicly);

// Specialized policy for shortId unique constraint violations
// Fast retries with no backoff since waiting doesn't help with uniqueness
const shortIdRetryPolicy = retry(
  handleType(Error, (err: any) => 
    err.name === 'SequelizeUniqueConstraintError' && 
    (err.fields?.shortId || err.message?.includes('short_id'))
  ), 
  {
    maxAttempts: 5,
    backoff: new ExponentialBackoff({ initialDelay: 10, maxDelay: 100 }), // Very short delays
  }
);

// Add monitoring to track collision rates
shortIdRetryPolicy.onRetry((args) => {
  console.warn(`ShortId collision detected - retry attempt ${args.attempt}`);
});

shortIdRetryPolicy.onFailure(() => {
  console.error('All shortId generation attempts exhausted, falling back to emergency ID');
});

// Specialized policy for username unique constraint violations
// More attempts than shortId since usernames are user-facing and failures are more visible
const usernameRetryPolicy = retry(
  handleType(Error, (err: any) => 
    err.name === 'SequelizeUniqueConstraintError' && 
    (err.fields?.userName || err.message?.includes('user_name') || err.message?.includes('username'))
  ), 
  {
    maxAttempts: 10, // More attempts since username failures are more user-visible
    backoff: new ExponentialBackoff({ initialDelay: 5, maxDelay: 50 }), // Very short delays
  }
);

// Add monitoring for username collisions
usernameRetryPolicy.onRetry((args) => {
  console.warn(`Username collision detected - retry attempt ${args.attempt}`);
});

usernameRetryPolicy.onFailure(() => {
  console.error('All username generation attempts exhausted, falling back to timestamp-based username');
});

// Policy for database connection issues (use circuit breaker)
const dbConnectionPolicy = wrap(
  circuitBreaker(
    handleType(Error, (err: any) => 
      err.name?.includes('Connection') || 
      err.message?.includes('connect') ||
      err.code === 'ECONNREFUSED'
    ), 
    {
      halfOpenAfter: 5 * 1000, // Shorter recovery for DB issues
      breaker: new ConsecutiveBreaker(3),
    }
  ),
  retry(handleAll, {
    maxAttempts: 5,
    backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 5000 }),
  })
);

export { 
  defaultPolicy,
  shortIdRetryPolicy,
  usernameRetryPolicy,
  dbConnectionPolicy
};