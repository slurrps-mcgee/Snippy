import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogMiddleware } from '../../common/middleware/request-id';
import { errorHandler } from '../../common/middleware/error-handler';
import logger from '../../common/utilities/logger';

describe('Logging Security - Bearer Token Redaction', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let loggerInfoSpy: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Setup mock request and response
    mockRequest = {
      requestId: 'test-request-id',
      method: 'GET',
      originalUrl: '',
    };

    const eventHandlers: { [key: string]: Function } = {};
    mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, handler: Function) => {
        eventHandlers[event] = handler;
        return mockResponse as Response;
      }),
      // Helper to trigger the 'finish' event
      _triggerFinish: () => {
        if (eventHandlers['finish']) {
          eventHandlers['finish']();
        }
      },
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    nextFunction = vi.fn();

    // Spy on logger methods
    loggerInfoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestLogMiddleware - success logging', () => {
    it('redacts bearer tokens from successful request logs', () => {
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}`;

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Trigger the finish event
      (mockResponse as any)._triggerFinish();

      // Verify logger.info was called
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'http_request',
        expect.objectContaining({
          requestId: 'test-request-id',
          method: 'GET',
          path: '/api/v1/snippets/shared/[REDACTED]',
          status: 200,
        })
      );

      // Verify token is NOT in the logged path
      const loggedPath = loggerInfoSpy.mock.calls[0][1].path;
      expect(loggedPath).not.toContain(token);
    });

    it('redacts tokens from URLs with query strings in success logs', () => {
      const token = 'abc123xyz789token456';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}?format=json`;

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      (mockResponse as any)._triggerFinish();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'http_request',
        expect.objectContaining({
          path: '/api/v1/snippets/shared/[REDACTED]',
        })
      );

      const loggedPath = loggerInfoSpy.mock.calls[0][1].path;
      expect(loggedPath).not.toContain(token);
      expect(loggedPath).not.toContain('format=json'); // Query string removed
    });

    it('does not redact non-sensitive paths', () => {
      mockRequest.originalUrl = '/api/v1/snippets/public';

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      (mockResponse as any)._triggerFinish();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'http_request',
        expect.objectContaining({
          path: '/api/v1/snippets/public',
        })
      );
    });

    it('calls next() to continue middleware chain', () => {
      mockRequest.originalUrl = '/api/v1/snippets/shared/token123';

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('errorHandler - error logging', () => {
    it('redacts bearer tokens from error logs', () => {
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}`;
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Verify logger.error was called with redacted path
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'request_error',
        expect.objectContaining({
          requestId: 'test-request-id',
          method: 'GET',
          path: '/api/v1/snippets/shared/[REDACTED]',
          status: 500,
        })
      );

      // Verify token is NOT in the logged path
      const loggedPath = loggerErrorSpy.mock.calls[0][1].path;
      expect(loggedPath).not.toContain(token);
    });

    it('redacts tokens from complete originalUrl in error logs', () => {
      // Reproduction Step 2: error handler records complete originalUrl
      const token = 'sensitive_bearer_token_xyz';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}?foo=bar&baz=qux`;
      const error = new Error('Not found');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'request_error',
        expect.objectContaining({
          path: '/api/v1/snippets/shared/[REDACTED]',
        })
      );

      const loggedPath = loggerErrorSpy.mock.calls[0][1].path;
      expect(loggedPath).not.toContain(token);
      expect(loggedPath).not.toContain('foo=bar'); // Query string removed
    });

    it('handles errors on non-sensitive paths without redaction', () => {
      mockRequest.originalUrl = '/api/v1/snippets/abc123';
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'request_error',
        expect.objectContaining({
          path: '/api/v1/snippets/abc123',
        })
      );
    });
  });

  describe('end-to-end security verification', () => {
    it('prevents token leakage across multiple log transports', () => {
      // Simulates the scenario where logs go to console, debug file, and error file
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}`;

      // Success log
      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      (mockResponse as any)._triggerFinish();

      // Error log
      const error = new Error('Test error');
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Verify token is not in any log call
      const allLogCalls = [
        ...loggerInfoSpy.mock.calls,
        ...loggerErrorSpy.mock.calls,
      ];

      allLogCalls.forEach(call => {
        const logData = JSON.stringify(call);
        expect(logData).not.toContain(token);
      });
    });

    it('ensures consistent redaction format across success and error logs', () => {
      const token = 'mytoken123';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}`;

      // Success log
      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      (mockResponse as any)._triggerFinish();

      // Error log
      const error = new Error('Test error');
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Both should use the same redacted format
      const successPath = loggerInfoSpy.mock.calls[0][1].path;
      const errorPath = loggerErrorSpy.mock.calls[0][1].path;

      expect(successPath).toBe('/api/v1/snippets/shared/[REDACTED]');
      expect(errorPath).toBe('/api/v1/snippets/shared/[REDACTED]');
      expect(successPath).toBe(errorPath);
    });

    it('verifies no token substring appears in any log output', () => {
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${token}`;

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      (mockResponse as any)._triggerFinish();

      const loggedData = JSON.stringify(loggerInfoSpy.mock.calls[0][1]);

      // Check that no substring of the token appears
      for (let i = 0; i < token.length - 2; i++) {
        const substring = token.substring(i, i + 3);
        expect(loggedData).not.toContain(substring);
      }
    });
  });

  describe('replay attack prevention verification', () => {
    it('ensures logged data cannot be used to replay requests', () => {
      // Simulates attacker scenario: access to logs but not to snippet
      const reusableToken = 'V1StGXR8_Z5jdHi6B-myT';
      mockRequest.originalUrl = `/api/v1/snippets/shared/${reusableToken}`;

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      (mockResponse as any)._triggerFinish();

      const loggedPath = loggerInfoSpy.mock.calls[0][1].path;

      // Attacker with log access should not be able to extract the token
      expect(loggedPath).toBe('/api/v1/snippets/shared/[REDACTED]');
      expect(loggedPath).not.toContain(reusableToken);

      // Verify the logged path cannot be used to construct a valid request
      expect(loggedPath).toContain('[REDACTED]');
    });

    it('redacts tokens that match nanoid(21) format used in production', () => {
      // Reproduction Step 7: tokens are generated with nanoid(21)
      const nanoidToken = 'V1StGXR8_Z5jdHi6B-myT'; // 21 chars
      mockRequest.originalUrl = `/api/v1/snippets/shared/${nanoidToken}`;

      requestLogMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      (mockResponse as any)._triggerFinish();

      const loggedPath = loggerInfoSpy.mock.calls[0][1].path;
      expect(loggedPath).not.toContain(nanoidToken);
      expect(loggedPath).toBe('/api/v1/snippets/shared/[REDACTED]');
    });
  });
});
