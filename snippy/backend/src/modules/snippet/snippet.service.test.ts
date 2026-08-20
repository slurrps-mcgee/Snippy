import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('./snippet.repo', () => ({
  findByShortId: vi.fn(),
  findBySnippetId: vi.fn(),
  createSnippet: vi.fn(),
  createSnippetFiles: vi.fn(),
  incrementSnippetForkCount: vi.fn(),
  incrementSnippetViewCount: vi.fn(),
  findByShareToken: vi.fn(),
  incrementSnippetEmbedCount: vi.fn(),
  updateSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  decrementSnippetForkCount: vi.fn(),
  getAllPublicSnippets: vi.fn(),
  getMySnippets: vi.fn(),
  getUserPublicSnippets: vi.fn(),
  searchSnippets: vi.fn(),
  getFeedSnippets: vi.fn(),
  updateSnippetFiles: vi.fn(),
}));

vi.mock('./snippetView.repo', () => ({
  findSnippetView: vi.fn(),
  upsertSnippetView: vi.fn(),
}));

vi.mock('../favorite/favorite.repo', () => ({
  findFavoritedSnippetIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock('../follow/follow.repo', () => ({
  findFollowingIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../database/minio', () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  latchMinioUnavailable: vi.fn(),
  isMinioConnectionError: vi.fn().mockReturnValue(false),
}));

import {
  forkSnippetHandler,
  getSnippetByShortIdHandler,
  updateSnippetViewCountHandler,
} from './snippet.service';
import {
  findByShortId,
  findBySnippetId,
  createSnippet,
  incrementSnippetForkCount,
} from './snippet.repo';
import { findSnippetView, upsertSnippetView } from './snippetView.repo';
import { incrementSnippetViewCount } from './snippet.repo';

const viewer = { payload: { sub: 'viewer' } };
const owner = { payload: { sub: 'owner' } };

function publicSnippet(overrides: Record<string, unknown> = {}) {
  return {
    snippetId: 'uuid-1',
    shortId: 'abc1234',
    auth0Id: 'owner',
    isPrivate: false,
    name: 'Pen',
    description: null,
    tags: [],
    forkCount: 0,
    viewCount: 4,
    commentCount: 0,
    favoriteCount: 0,
    snippetFiles: [],
    cdnResources: [],
    ...overrides,
  };
}

describe('snippet privacy and social rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids reading another user private snippet', async () => {
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      getSnippetByShortIdHandler({ auth: viewer, params: { shortId: 'abc1234' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows the owner to read a private snippet', async () => {
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    const result = await getSnippetByShortIdHandler({
      auth: owner,
      params: { shortId: 'abc1234' },
    });
    expect(result.snippet?.shortId).toBe('abc1234');
    expect(result.snippet?.isOwner).toBe(true);
  });

  it('forbids forking another user private snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      forkSnippetHandler({ auth: viewer, params: { snippetId: 'uuid-1' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('forks a public snippet', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(publicSnippet() as any)
      .mockResolvedValueOnce(
        publicSnippet({ snippetId: 'fork-1', auth0Id: 'viewer', parentShortId: 'abc1234' }) as any
      );
    vi.mocked(createSnippet).mockResolvedValue({ snippetId: 'fork-1' } as any);

    const result = await forkSnippetHandler({ auth: viewer, params: { snippetId: 'uuid-1' } });
    expect(createSnippet).toHaveBeenCalled();
    expect(incrementSnippetForkCount).toHaveBeenCalled();
    expect(result.snippet?.snippetId).toBe('fork-1');
  });

  it('does not count owner views', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ viewCount: 4 }) as any);
    const result = await updateSnippetViewCountHandler({
      auth: owner,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.counted).toBe(false);
    expect(upsertSnippetView).not.toHaveBeenCalled();
  });

  it('skips counting during the 24h cooldown', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ viewCount: 4 }) as any);
    vi.mocked(findSnippetView).mockResolvedValue({ lastViewedAt: new Date() } as any);
    const result = await updateSnippetViewCountHandler({
      auth: viewer,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.counted).toBe(false);
    expect(incrementSnippetViewCount).not.toHaveBeenCalled();
  });

  it('counts a view after cooldown', async () => {
    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(publicSnippet({ viewCount: 4 }) as any)
      .mockResolvedValueOnce(publicSnippet({ viewCount: 5 }) as any);
    vi.mocked(findSnippetView).mockResolvedValue({
      lastViewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    } as any);

    const result = await updateSnippetViewCountHandler({
      auth: viewer,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.counted).toBe(true);
    expect(result.viewCount).toBe(5);
  });
});
