import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomError } from '../../common/exceptions/custom-error';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('./favorite.repo', () => ({
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
  findFavoriteSnippetByUserAndSnippet: vi.fn(),
  findFavoriteSnippetsByUser: vi.fn(),
}));

vi.mock('../snippet/snippet.repo', () => ({
  findBySnippetId: vi.fn(),
  incrementSnippetFavoriteCount: vi.fn(),
  decrementSnippetFavoriteCount: vi.fn(),
}));

import { favoriteHandler } from './favorite.service';
import {
  findFavoriteSnippetByUserAndSnippet,
  createFavorite,
  deleteFavorite,
} from './favorite.repo';
import {
  findBySnippetId,
  incrementSnippetFavoriteCount,
  decrementSnippetFavoriteCount,
} from '../snippet/snippet.repo';

const auth = { payload: { sub: 'user-1' } };

describe('favoriteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a favorite on a public snippet', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce({
        snippetId: 's1',
        isPrivate: false,
        auth0Id: 'other',
        favoriteCount: 0,
      } as any)
      .mockResolvedValueOnce({ snippetId: 's1', favoriteCount: 1 } as any);
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue(null);

    const result = await favoriteHandler({ auth, params: { snippetId: 's1' } });
    expect(createFavorite).toHaveBeenCalled();
    expect(incrementSnippetFavoriteCount).toHaveBeenCalledWith('s1', undefined);
    expect(result.isFavorited).toBe(true);
    expect(result.favoriteCount).toBe(1);
  });

  it('removes an existing favorite', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce({
        snippetId: 's1',
        isPrivate: false,
        auth0Id: 'other',
        favoriteCount: 1,
      } as any)
      .mockResolvedValueOnce({ snippetId: 's1', favoriteCount: 0 } as any);
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue({ favoriteId: 'f1' } as any);

    const result = await favoriteHandler({ auth, params: { snippetId: 's1' } });
    expect(deleteFavorite).toHaveBeenCalled();
    expect(decrementSnippetFavoriteCount).toHaveBeenCalled();
    expect(result.isFavorited).toBe(false);
  });

  it('forbids favoriting another user private snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue({
      snippetId: 's1',
      isPrivate: true,
      auth0Id: 'owner',
      favoriteCount: 0,
    } as any);

    await expect(favoriteHandler({ auth, params: { snippetId: 's1' } })).rejects.toMatchObject({
      statusCode: 403,
    } satisfies Partial<CustomError>);
  });
});
