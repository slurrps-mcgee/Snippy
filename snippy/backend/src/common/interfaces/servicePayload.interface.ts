/**
 * Generic service payload interface with type-safe body, params, and query
 * Uses Partial for params and query to work smoothly with Express Request objects
 * @template TBody - Type of request body  
 * @template TParams - Type of route parameters
 * @template TQuery - Type of query parameters
 */
export interface ServicePayload<TBody = unknown, TParams = unknown, TQuery = unknown> {
    auth?: { payload?: { sub: string } };
    body?: TBody;
    params?: Partial<TParams>;
    query?: Partial<TQuery>;
}