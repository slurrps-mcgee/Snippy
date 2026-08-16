import { describe, expect, it } from 'vitest';
import { validateCreateSnippet, validateUpdateSnippet } from './snippet.validator';
import { validateCreateComment } from '../comment/comment.validator';
import { validateCreateOrDeleteFavorite } from '../favorite/favorite.validator';
import { CustomError } from '../../common/exceptions/custom-error';

describe('snippet validators', () => {
  it('accepts a valid create payload', () => {
    const payload = {
      name: 'Hello',
      snippetFiles: [{ fileType: 'html', content: '<h1>Hi</h1>' }],
    };
    expect(() => validateCreateSnippet(payload)).not.toThrow();
  });

  it('rejects a missing name', () => {
    expect(() => validateCreateSnippet({ snippetFiles: [] })).toThrow(CustomError);
  });

  it('strips HTML from the name', () => {
    const payload = { name: '<b>Hello</b>' };
    validateCreateSnippet(payload);
    expect(payload.name).toBe('Hello');
  });

  it('rejects an unknown file type on update', () => {
    expect(() =>
      validateUpdateSnippet({
        snippetFiles: [{ fileType: 'python', content: 'print(1)' }],
      })
    ).toThrow(CustomError);
  });
});

describe('comment validators', () => {
  it('rejects empty content', () => {
    expect(() => validateCreateComment({ content: '' })).toThrow(CustomError);
  });

  it('accepts a comment', () => {
    const payload = { content: 'Nice pen' };
    expect(() => validateCreateComment(payload)).not.toThrow();
  });
});

describe('favorite validators', () => {
  it('requires a UUID snippetId', () => {
    expect(() => validateCreateOrDeleteFavorite({ snippetId: 'not-a-uuid' })).toThrow(CustomError);
  });

  it('accepts a UUID', () => {
    expect(() =>
      validateCreateOrDeleteFavorite({ snippetId: '550e8400-e29b-41d4-a716-446655440000' })
    ).not.toThrow();
  });
});
