import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicCollection, publicSnippet, publicUser } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/collection/collection.repo', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  findCollectionById: vi.fn(),
  findCollectionByShortId: vi.fn(),
  findMyCollections: vi.fn(),
  findUserPublicCollections: vi.fn(),
  findCollectionSnippetsOrdered: vi.fn(),
  countCollectionSnippets: vi.fn(),
  countSnippetsForCollections: vi.fn(),
  findCollectionIdsContainingSnippet: vi.fn(),
  findCollectionSnippet: vi.fn(),
  getMaxCollectionPosition: vi.fn(),
  addCollectionSnippet: vi.fn(),
  removeCollectionSnippet: vi.fn(),
  setCollectionSnippetPositions: vi.fn(),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findByUsername: vi.fn(),
}));

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findBySnippetId: vi.fn(),
}));

vi.mock('../../modules/favorite/favorite.repo', () => ({
  findFavoritedSnippetIds: vi.fn().mockResolvedValue(new Set()),
}));

import {
  createCollectionHandler,
  updateCollectionHandler,
  deleteCollectionHandler,
  getMyCollectionsHandler,
  getUserCollectionsHandler,
  getCollectionByShortIdHandler,
  addSnippetToCollectionHandler,
  removeSnippetFromCollectionHandler,
  reorderCollectionSnippetsHandler,
} from '../../modules/collection/collection.service';
import {
  createCollection,
  updateCollection,
  deleteCollection,
  findCollectionById,
  findCollectionByShortId,
  findMyCollections,
  findUserPublicCollections,
  findCollectionSnippetsOrdered,
  countCollectionSnippets,
  countSnippetsForCollections,
  findCollectionSnippet,
  getMaxCollectionPosition,
  addCollectionSnippet,
  setCollectionSnippetPositions,
} from '../../modules/collection/collection.repo';
import { findByUsername } from '../../modules/user/user.repo';
import { findBySnippetId } from '../../modules/snippet/snippet.repo';

const auth = authAs('owner');
const viewer = authAs('viewer');

describe('collection CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication to create', async () => {
    await expect(createCollectionHandler({ body: { name: 'Mine' } })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('creates a collection', async () => {
    vi.mocked(createCollection).mockResolvedValue(publicCollection() as any);
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);

    const result = await createCollectionHandler({ auth, body: { name: 'Mine' } });
    expect(result.collection?.name).toBe('My Collection');
    expect(result.collection?.isOwner).toBe(true);
  });

  it('rejects an empty update patch', async () => {
    await expect(
      updateCollectionHandler({
        auth,
        params: { collectionId: 'col-1' },
        body: { collectionId: 'hack' } as any,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('forbids updating another user collection', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    await expect(
      updateCollectionHandler({
        auth: viewer,
        params: { collectionId: 'col-1' },
        body: { name: 'Nope' },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates an owned collection', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection({ name: 'Updated' }) as any);
    vi.mocked(countCollectionSnippets).mockResolvedValue(2);

    const result = await updateCollectionHandler({
      auth,
      params: { collectionId: 'col-1' },
      body: { name: 'Updated' },
    });
    expect(updateCollection).toHaveBeenCalled();
    expect(result.collection?.snippetCount).toBe(2);
  });

  it('deletes an owned collection', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    const result = await deleteCollectionHandler({ auth, params: { collectionId: 'col-1' } });
    expect(deleteCollection).toHaveBeenCalledWith('col-1', undefined);
    expect(result.message).toBe('Collection deleted successfully');
  });
});

describe('collection lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 3]]));
  });

  it('lists the current user collections', async () => {
    vi.mocked(findMyCollections).mockResolvedValue({
      rows: [publicCollection() as any],
      count: 1,
    });

    const result = await getMyCollectionsHandler({ auth });
    expect(result.totalCount).toBe(1);
    expect(result.collections?.[0].snippetCount).toBe(3);
  });

  it('forbids listing collections of a private user', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'other', isPrivate: true }) as any
    );
    await expect(
      getUserCollectionsHandler({ auth: viewer, params: { userName: 'alice' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('uses findMyCollections when the viewer is the owner', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findMyCollections).mockResolvedValue({ rows: [publicCollection() as any], count: 1 });

    await getUserCollectionsHandler({ auth, params: { userName: 'owner' } });
    expect(findMyCollections).toHaveBeenCalled();
    expect(findUserPublicCollections).not.toHaveBeenCalled();
  });

  it('uses public collections for a visitor', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [publicCollection() as any],
      count: 1,
    });

    await getUserCollectionsHandler({ auth: viewer, params: { userName: 'owner' } });
    expect(findUserPublicCollections).toHaveBeenCalled();
  });
});

describe('getCollectionByShortIdHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids reading a private collection', async () => {
    vi.mocked(findCollectionByShortId).mockResolvedValue(
      publicCollection({ isPrivate: true }) as any
    );
    await expect(
      getCollectionByShortIdHandler({ auth: viewer, params: { shortId: 'col1234' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('hides other users private snippets from visitors', async () => {
    vi.mocked(findCollectionByShortId).mockResolvedValue(publicCollection() as any);
    vi.mocked(findCollectionSnippetsOrdered).mockResolvedValue([
      { snippet: publicSnippet({ snippetId: 'pub', isPrivate: false }) },
      { snippet: publicSnippet({ snippetId: 'priv', isPrivate: true, auth0Id: 'owner' }) },
      { snippet: publicSnippet({ snippetId: 'mine', isPrivate: true, auth0Id: 'viewer' }) },
    ] as any);

    const result = await getCollectionByShortIdHandler({
      auth: viewer,
      params: { shortId: 'col1234' },
    });
    const ids = result.collection?.snippets?.map((s) => s.snippetId);
    expect(ids).toEqual(['pub', 'mine']);
  });
});

describe('collection membership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids adding another user private snippet', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ isPrivate: true, auth0Id: 'other' }) as any
    );

    await expect(
      addSnippetToCollectionHandler({
        auth,
        params: { collectionId: 'col-1' },
        body: { snippetId: 'uuid-1' },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects a duplicate membership', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findCollectionSnippet).mockResolvedValue({ collectionId: 'col-1' } as any);

    await expect(
      addSnippetToCollectionHandler({
        auth,
        params: { collectionId: 'col-1' },
        body: { snippetId: 'uuid-1' },
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('appends a snippet after the current max position', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findCollectionSnippet).mockResolvedValue(null);
    vi.mocked(getMaxCollectionPosition).mockResolvedValue(2);
    vi.mocked(countCollectionSnippets).mockResolvedValue(3);

    await addSnippetToCollectionHandler({
      auth,
      params: { collectionId: 'col-1' },
      body: { snippetId: 'uuid-1' },
    });
    expect(addCollectionSnippet).toHaveBeenCalledWith('col-1', 'uuid-1', 3, undefined);
  });

  it('rejects a reorder that does not match membership', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    vi.mocked(findCollectionSnippetsOrdered).mockResolvedValue([
      { snippetId: 'a' },
      { snippetId: 'b' },
    ] as any);

    await expect(
      reorderCollectionSnippetsHandler({
        auth,
        params: { collectionId: 'col-1' },
        body: { snippetIds: ['a'] },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('reorders when snippetIds match membership', async () => {
    vi.mocked(findCollectionById).mockResolvedValue(publicCollection() as any);
    vi.mocked(findCollectionSnippetsOrdered).mockResolvedValue([
      { snippetId: 'a' },
      { snippetId: 'b' },
    ] as any);

    const result = await reorderCollectionSnippetsHandler({
      auth,
      params: { collectionId: 'col-1' },
      body: { snippetIds: ['b', 'a'] },
    });
    expect(setCollectionSnippetPositions).toHaveBeenCalledWith('col-1', ['b', 'a'], undefined);
    expect(result.message).toBe('Collection order updated');
  });

  it('requires collection and snippet ids to remove', async () => {
    await expect(
      removeSnippetFromCollectionHandler({ auth, params: { collectionId: 'col-1' } as any })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
