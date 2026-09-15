import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '../../common/services/authorization.service';
import { CustomError } from '../../common/exceptions/custom-error';

describe('AuthorizationService', () => {
  it('throws 403 when the user does not own the resource', () => {
    expect(() => AuthorizationService.verifyOwnership('owner', 'viewer', 'snippet')).toThrow(
      CustomError
    );
    try {
      AuthorizationService.verifyOwnership('owner', 'viewer', 'snippet');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 403, message: 'Forbidden: not snippet owner' });
    }
  });

  it('allows the owner through', () => {
    expect(() => AuthorizationService.verifyOwnership('user-1', 'user-1', 'user')).not.toThrow();
  });

  it('reports ownership without throwing', () => {
    expect(AuthorizationService.isOwner('user-1', 'user-1')).toBe(true);
    expect(AuthorizationService.isOwner('user-1', 'other')).toBe(false);
  });
});
