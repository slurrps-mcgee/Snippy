import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicSnippet, publicUser } from '../helpers';
import { featureFlags } from '../../config';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('nanoid', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nanoid')>();
  return {
    ...actual,
    nanoid: () => 'abcdefghijklmnopqrstu',
  };
});

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findByShortId: vi.fn(),
  findBySnippetId: vi.fn(),
  createSnippet: vi.fn(),
  createSnippetFiles: vi.fn(),
  incrementSnippetForkCount: vi.fn(),
  incrementSnippetViewCount: vi.fn(),
  findByShareToken: vi.fn(),
  incrementSnippetEmbedCount: vi.fn().mockResolvedValue(undefined),
  updateSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  decrementSnippetForkCount: vi.fn(),
  getAllPublicSnippets: vi.fn(),
  getMySnippets: vi.fn(),
  getUserPublicSnippets: vi.fn(),
  searchSnippets: vi.fn(),
  getFeedSnippets: vi.fn(),
  updateSnippetFiles: vi.fn(),
  getForksByParentShortId: vi.fn(),
}));

vi.mock('../../modules/snippet/snippetView.repo', () => ({
  findSnippetView: vi.fn(),
  upsertSnippetView: vi.fn(),
}));

vi.mock('../../modules/favorite/favorite.repo', () => ({
  findFavoritedSnippetIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock('../../modules/follow/follow.repo', () => ({
  findFollowingIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findByUsername: vi.fn(),
}));

vi.mock('../../database/minio', () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  latchMinioUnavailable: vi.fn(),
  isMinioConnectionError: vi.fn().mockReturnValue(false),
}));

import {
  createSnippetHandler,
  forkSnippetHandler,
  getSnippetByShortIdHandler,
  updateSnippetViewCountHandler,
  updateSnippetHandler,
  deleteSnippetHandler,
  getSnippetByShareTokenHandler,
  createSnippetShareLinkHandler,
  revokeSnippetShareLinkHandler,
  getAllPublicSnippetsHandler,
  getUserPublicSnippetsHandler,
  getMySnippetsHandler,
  searchSnippetsHandler,
  getFeedSnippetsHandler,
  getSnippetForksHandler,
  getSnippetEmbedHtmlHandler,
  uploadSnippetSnapshotHandler,
} from '../../modules/snippet/snippet.service';
import {
  findByShortId,
  findBySnippetId,
  createSnippet,
  incrementSnippetForkCount,
  incrementSnippetViewCount,
  createSnippetFiles,
  updateSnippet,
  deleteSnippet,
  decrementSnippetForkCount,
  findByShareToken,
  getAllPublicSnippets,
  getUserPublicSnippets,
  getMySnippets,
  searchSnippets,
  getFeedSnippets,
  getForksByParentShortId,
} from '../../modules/snippet/snippet.repo';
import { findSnippetView, upsertSnippetView } from '../../modules/snippet/snippetView.repo';
import { findByUsername } from '../../modules/user/user.repo';
import { findFollowingIds } from '../../modules/follow/follow.repo';
import { minioClient } from '../../database/minio';

const viewer = authAs('viewer');
const owner = authAs('owner');

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

describe('snippet CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a snippet with files', async () => {
    vi.mocked(createSnippet).mockResolvedValue({ snippetId: 'new-1' } as any);
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ snippetId: 'new-1', auth0Id: 'viewer' }) as any
    );

    const result = await createSnippetHandler({
      auth: viewer,
      body: {
        name: 'New',
        snippetFiles: [{ fileType: 'html', content: '<h1>Hi</h1>' }],
      } as any,
    });
    expect(createSnippetFiles).toHaveBeenCalled();
    expect(result.snippet?.snippetId).toBe('new-1');
  });

  it('forbids updating another user snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    await expect(
      updateSnippetHandler({
        auth: viewer,
        params: { snippetId: 'uuid-1' },
        body: { name: 'Nope' },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('strips protected fields on update', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ name: 'Updated' }) as any);
    const body: Record<string, unknown> = {
      name: 'Updated',
      snippetId: 'hack',
      auth0Id: 'hack',
      shareToken: 'hack',
    };

    await updateSnippetHandler({
      auth: owner,
      params: { snippetId: 'uuid-1' },
      body: body as any,
    });
    const patch = vi.mocked(updateSnippet).mock.calls[0][1] as Record<string, unknown>;
    expect(patch.snippetId).toBeUndefined();
    expect(patch.auth0Id).toBeUndefined();
    expect(patch.shareToken).toBeUndefined();
    expect(patch.name).toBe('Updated');
  });

  it('decrements parent fork count on delete', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ parentShortId: 'parent1' }) as any
    );
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet({ snippetId: 'parent-id' }) as any);

    const result = await deleteSnippetHandler({ auth: owner, params: { snippetId: 'uuid-1' } });
    expect(decrementSnippetForkCount).toHaveBeenCalledWith('parent-id', undefined);
    expect(deleteSnippet).toHaveBeenCalledWith('uuid-1', undefined);
    expect(result.message).toBe('Snippet deleted successfully');
  });
});

describe('snippet share links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows reading a private snippet by share token', async () => {
    vi.mocked(findByShareToken).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    const result = await getSnippetByShareTokenHandler({
      auth: viewer,
      params: { token: 'tok' },
    });
    expect(result.snippet?.shortId).toBe('abc1234');
  });

  it('reuses an existing share token', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ shareToken: 'existing-token' }) as any
    );
    const result = await createSnippetShareLinkHandler({
      auth: owner,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.shareToken).toBe('existing-token');
    expect(updateSnippet).not.toHaveBeenCalled();
  });

  it('creates a share token when missing', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ shareToken: null }) as any);
    const result = await createSnippetShareLinkHandler({
      auth: owner,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.shareToken).toBe('abcdefghijklmnopqrstu');
    expect(updateSnippet).toHaveBeenCalledWith(
      'uuid-1',
      { shareToken: 'abcdefghijklmnopqrstu' },
      undefined
    );
  });

  it('revokes a share token', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    await revokeSnippetShareLinkHandler({ auth: owner, params: { snippetId: 'uuid-1' } });
    expect(updateSnippet).toHaveBeenCalledWith('uuid-1', { shareToken: null }, undefined);
  });
});

describe('snippet lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication for my snippets', async () => {
    await expect(getMySnippetsHandler({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lists the current user snippets', async () => {
    vi.mocked(getMySnippets).mockResolvedValue({ rows: [publicSnippet() as any], count: 1 });
    const result = await getMySnippetsHandler({ auth: owner });
    expect(result.totalCount).toBe(1);
  });

  it('forbids listing snippets of a private user', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'owner', isPrivate: true }) as any
    );
    await expect(
      getUserPublicSnippetsHandler({ auth: viewer, params: { userName: 'owner' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('lists another user public snippets', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(getUserPublicSnippets).mockResolvedValue({
      rows: [publicSnippet() as any],
      count: 1,
    });
    const result = await getUserPublicSnippetsHandler({
      auth: viewer,
      params: { userName: 'alice' },
    });
    expect(result.totalCount).toBe(1);
  });

  it('returns an empty search when q is blank', async () => {
    const result = await searchSnippetsHandler({ query: { q: '   ' } });
    expect(result).toEqual({ snippets: [], totalCount: 0 });
    expect(searchSnippets).not.toHaveBeenCalled();
  });

  it('searches snippets', async () => {
    vi.mocked(searchSnippets).mockResolvedValue({ rows: [publicSnippet() as any], count: 1 });
    const result = await searchSnippetsHandler({ query: { q: 'pen' } });
    expect(result.totalCount).toBe(1);
  });

  it('feeds snippets from followed users', async () => {
    vi.mocked(findFollowingIds).mockResolvedValue(['owner']);
    vi.mocked(getFeedSnippets).mockResolvedValue({ rows: [publicSnippet() as any], count: 1 });
    const result = await getFeedSnippetsHandler({ auth: viewer });
    expect(getFeedSnippets).toHaveBeenCalledWith(['owner'], 0, 10, undefined, undefined, undefined);
    expect(result.totalCount).toBe(1);
  });

  it('lists public snippets', async () => {
    vi.mocked(getAllPublicSnippets).mockResolvedValue({
      rows: [publicSnippet() as any],
      count: 1,
    });
    const result = await getAllPublicSnippetsHandler({ query: { sort: 'newest' } });
    expect(result.totalCount).toBe(1);
  });

  it('forbids listing forks of a private parent', async () => {
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      getSnippetForksHandler({ auth: viewer, params: { shortId: 'abc1234' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('lists forks of a public parent', async () => {
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(getForksByParentShortId).mockResolvedValue({
      rows: [publicSnippet({ snippetId: 'fork-1' }) as any],
      count: 1,
    });
    const result = await getSnippetForksHandler({
      auth: viewer,
      params: { shortId: 'abc1234' },
    });
    expect(getForksByParentShortId).toHaveBeenCalledWith('abc1234', 0, 10, false, undefined);
    expect(result.totalCount).toBe(1);
  });
});

describe('snippet embed and snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlags.isMinioAvailable = true;
  });

  it('returns 404 for a private embed', async () => {
    vi.mocked(findByShortId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      getSnippetEmbedHtmlHandler({ params: { shortId: 'abc1234' } })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('builds escaped embed HTML for a public snippet', async () => {
    vi.mocked(findByShortId).mockResolvedValue(
      publicSnippet({
        name: '<script>x</script>',
        snippetFiles: [
          { fileType: 'html', content: '<h1>Hi</h1>' },
          { fileType: 'css', content: 'h1{color:red}' },
          { fileType: 'js', content: 'console.log(1)' },
        ],
        cdnResources: [{ resourceType: 'css', url: 'https://cdn.example/lib.css' }],
      }) as any
    );

    const html = await getSnippetEmbedHtmlHandler({ params: { shortId: 'abc1234' } });
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('<h1>Hi</h1>');
    expect(html).toContain('h1{color:red}');
    expect(html).toContain('https://cdn.example/lib.css');
  });

  it('returns 503 when MinIO is down for snapshot upload', async () => {
    featureFlags.isMinioAvailable = false;
    await expect(
      uploadSnippetSnapshotHandler({
        auth: owner,
        params: { snippetId: 'uuid-1' },
        file: { buffer: Buffer.from('x'), mimetype: 'image/jpeg' },
      })
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  it('forbids snapshot upload by a non-owner', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    await expect(
      uploadSnippetSnapshotHandler({
        auth: viewer,
        params: { snippetId: 'uuid-1' },
        file: { buffer: Buffer.from('x'), mimetype: 'image/jpeg' },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects an unsupported snapshot mime type', async () => {
    await expect(
      uploadSnippetSnapshotHandler({
        auth: owner,
        params: { snippetId: 'uuid-1' },
        file: { buffer: Buffer.from('x'), mimetype: 'application/pdf' },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('uploads a snapshot and stores the url', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ snapshotUrl: '/content/owner/snippets/uuid-1.jpg' }) as any
    );

    const result = await uploadSnippetSnapshotHandler({
      auth: owner,
      params: { snippetId: 'uuid-1' },
      file: { buffer: Buffer.from('jpg'), mimetype: 'image/jpeg' },
    });
    expect(minioClient.putObject).toHaveBeenCalled();
    expect(updateSnippet).toHaveBeenCalled();
    expect(result.snippet?.snapshotUrl).toBe('/content/owner/snippets/uuid-1.jpg');
  });
});
