import { describe, expect, it, vi } from 'vitest';
import { CustomError } from '../../common/exceptions/custom-error';

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { handleError } from '../../common/utilities/error';

describe('handleError', () => {
  it('rethrows CustomError', () => {
    expect(() => handleError(new CustomError('Nope', 403), 'test')).toThrow(CustomError);
    try {
      handleError(new CustomError('Nope', 403), 'test');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 403, message: 'Nope' });
    }
  });

  it('maps unique constraint errors to 409', () => {
    try {
      handleError({ name: 'SequelizeUniqueConstraintError' }, 'test');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 409 });
    }
  });

  it('maps shortId unique failures to 500', () => {
    try {
      handleError({ name: 'SequelizeUniqueConstraintError', fields: { shortId: 'abc' } }, 'test');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 500 });
    }
  });

  it('maps validation errors to 400', () => {
    try {
      handleError({ name: 'SequelizeValidationError', message: 'bad' }, 'test');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400, message: 'bad' });
    }
  });

  it('maps foreign key errors to 400', () => {
    try {
      handleError({ name: 'SequelizeForeignKeyConstraintError' }, 'test');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400 });
    }
  });

  it('maps unknown errors to 500', () => {
    try {
      handleError({ name: 'SomethingElse' }, 'test');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 500, message: 'Database error' });
    }
  });
});
