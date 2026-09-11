import { describe, expect, it } from 'vitest';
import {
  validateCreateSnippet,
  validateUpdateSnippet,
} from '../../modules/snippet/snippet.validator';
import {
  validateCreateComment,
  validateUpdateComment,
} from '../../modules/comment/comment.validator';
import { validateCreateOrDeleteFavorite } from '../../modules/favorite/favorite.validator';
import { validateRegister, validateUpdateUser } from '../../modules/user/user.validator';
import {
  validateCreateCollection,
  validateUpdateCollection,
  validateAddCollectionSnippet,
  validateReorderCollectionSnippets,
} from '../../modules/collection/collection.validator';
import { validateAssetId, validateAssetSubFolder } from '../../modules/asset/asset.validator';
import { validateFollowUserName } from '../../modules/follow/follow.validator';
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

  it('rejects empty update content', () => {
    expect(() => validateUpdateComment({ content: '' })).toThrow(CustomError);
  });

  it('strips HTML from update content', () => {
    const payload = { content: '<script>x</script>Hi' };
    validateUpdateComment(payload);
    expect(payload.content).toBe('Hi');
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

describe('user validators', () => {
  it('accepts a valid register payload', () => {
    expect(() => validateRegister({ name: 'Alice' })).not.toThrow();
  });

  it('strips HTML from the register name', () => {
    const payload = { name: '<b>Alice</b>' };
    validateRegister(payload);
    expect(payload.name).toBe('Alice');
  });

  it('rejects a too-short register name', () => {
    expect(() => validateRegister({ name: 'A' })).toThrow(CustomError);
  });

  it('strips HTML from update fields', () => {
    const payload = { displayName: '<i>Alice</i>', bio: '<b>Hi</b>' };
    validateUpdateUser(payload);
    expect(payload.displayName).toBe('Alice');
    expect(payload.bio).toBe('Hi');
  });

  it('rejects an unknown editor theme', () => {
    expect(() => validateUpdateUser({ editorPreferences: { theme: 'not-a-theme' } })).toThrow(
      CustomError
    );
  });
});

describe('collection validators', () => {
  it('requires a name on create', () => {
    expect(() => validateCreateCollection({})).toThrow(CustomError);
  });

  it('strips HTML from the collection name', () => {
    const payload = { name: '<b>Mine</b>' };
    validateCreateCollection(payload);
    expect(payload.name).toBe('Mine');
  });

  it('rejects an empty update', () => {
    expect(() => validateUpdateCollection({})).toThrow(CustomError);
  });

  it('requires a UUID when adding a snippet', () => {
    expect(() => validateAddCollectionSnippet({ snippetId: 'nope' })).toThrow(CustomError);
  });

  it('accepts a reorder payload', () => {
    expect(() =>
      validateReorderCollectionSnippets({
        snippetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      })
    ).not.toThrow();
  });

  it('rejects a reorder payload that is not an array', () => {
    expect(() => validateReorderCollectionSnippets({ snippetIds: 'x' })).toThrow(CustomError);
  });
});

describe('asset validators', () => {
  it('requires a UUID assetId', () => {
    expect(() => validateAssetId({ assetId: 'nope' })).toThrow(CustomError);
  });

  it('accepts a UUID assetId', () => {
    expect(() =>
      validateAssetId({ assetId: '550e8400-e29b-41d4-a716-446655440000' })
    ).not.toThrow();
  });

  it('rejects an invalid subfolder charset', () => {
    expect(() => validateAssetSubFolder({ subFolder: 'bad folder' })).toThrow(CustomError);
  });

  it('accepts a valid subfolder', () => {
    expect(() => validateAssetSubFolder({ subFolder: 'general' })).not.toThrow();
  });
});

describe('follow validators', () => {
  it('requires a userName', () => {
    expect(() => validateFollowUserName({})).toThrow(CustomError);
  });

  it('accepts a userName', () => {
    expect(() => validateFollowUserName({ userName: 'alice' })).not.toThrow();
  });
});
