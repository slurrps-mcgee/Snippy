import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicSnippet } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/favorite/favorite.repo', () => ({
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
  findFavoriteSnippetByUserAndSnippet: vi.fn(),
  findFavoriteSnippetsByUser: vi.fn(),
}));

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findBySnippetId: vi.fn(),
  incrementSnippetFavoriteCount: vi.fn(),
  decrementSnippetFavoriteCount: vi.fn(),
}));

import {
  favoriteHandler,
  getFavoriteSnippetsByUserHandler,
  isFavoriteHandler,
} from '../../modules/favorite/favorite.service';
import {
  findFavoriteSnippetByUserAndSnippet,
  createFavorite,
  deleteFavorite,
  findFavoriteSnippetsByUser,
} from '../../modules/favorite/favorite.repo';
import {
  findBySnippetId,
  incrementSnippetFavoriteCount,
  decrementSnippetFavoriteCount,
} from '../../modules/snippet/snippet.repo';

const auth = authAs('user-1');

describe('favoriteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a favorite on a public snippet', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(publicSnippet({ favoriteCount: 0 }) as any)
      .mockResolvedValueOnce(publicSnippet({ favoriteCount: 1 }) as any);
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue(null);

    const result = await favoriteHandler({ auth, params: { snippetId: 'uuid-1' } });
    expect(createFavorite).toHaveBeenCalled();
    expect(incrementSnippetFavoriteCount).toHaveBeenCalledWith('uuid-1', undefined);
    expect(result.isFavorited).toBe(true);
    expect(result.favoriteCount).toBe(1);
  });

  it('removes an existing favorite', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(publicSnippet({ favoriteCount: 1 }) as any)
      .mockResolvedValueOnce(publicSnippet({ favoriteCount: 0 }) as any);
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue({ favoriteId: 'f1' } as any);

    const result = await favoriteHandler({ auth, params: { snippetId: 'uuid-1' } });
    expect(deleteFavorite).toHaveBeenCalled();
    expect(decrementSnippetFavoriteCount).toHaveBeenCalled();
    expect(result.isFavorited).toBe(false);
  });

  it('forbids favoriting another user private snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ isPrivate: true, auth0Id: 'owner' }) as any
    );

    await expect(favoriteHandler({ auth, params: { snippetId: 'uuid-1' } })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows the owner to favorite their private snippet', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(publicSnippet({ isPrivate: true, favoriteCount: 0 }) as any)
      .mockResolvedValueOnce(publicSnippet({ isPrivate: true, favoriteCount: 1 }) as any);
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue(null);

    const result = await favoriteHandler({
      auth: authAs('owner'),
      params: { snippetId: 'uuid-1' },
    });
    expect(result.isFavorited).toBe(true);
    expect(createFavorite).toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    await expect(favoriteHandler({ params: { snippetId: 'uuid-1' } })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('requires a snippetId', async () => {
    await expect(favoriteHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 404 when the snippet is missing', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(null);
    await expect(favoriteHandler({ auth, params: { snippetId: 'uuid-1' } })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('getFavoriteSnippetsByUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(getFavoriteSnippetsByUserHandler({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns the user favorite list', async () => {
    vi.mocked(findFavoriteSnippetsByUser).mockResolvedValue({
      rows: [publicSnippet() as any],
      count: 1,
    });

    const result = await getFavoriteSnippetsByUserHandler({ auth, query: { page: 1, limit: 10 } });
    expect(result.totalCount).toBe(1);
    expect(result.snippets).toHaveLength(1);
    expect(result.snippets?.[0].snippetId).toBe('uuid-1');
    expect(result.snippets?.[0].isFavorited).toBe(true);
  });
});

describe('isFavoriteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when a favorite exists', async () => {
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue({ favoriteId: 'f1' } as any);
    const result = await isFavoriteHandler({ auth, params: { snippetId: 'uuid-1' } });
    expect(result.isFavorited).toBe(true);
  });

  it('returns false when a favorite does not exist', async () => {
    vi.mocked(findFavoriteSnippetByUserAndSnippet).mockResolvedValue(null);
    const result = await isFavoriteHandler({ auth, params: { snippetId: 'uuid-1' } });
    expect(result.isFavorited).toBe(false);
  });

  it('requires a snippetId', async () => {
    await expect(isFavoriteHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });
});
