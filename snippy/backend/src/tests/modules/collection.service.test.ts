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

describe('snippet count visibility filtering (pentest mitigation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes private snippets from count for unauthenticated viewers', async () => {
    // Setup: User "owner" has a public collection with 2 public snippets and 1 private snippet
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any],
      count: 1,
    });

    // Mock countSnippetsForCollections to return only public snippets (2) when no viewer is provided
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 2]]));

    // Act: Unauthenticated viewer requests public collections
    const result = await getUserCollectionsHandler({
      auth: undefined,
      params: { userName: 'owner' },
    });

    // Assert: countSnippetsForCollections was called with undefined viewerAuth0Id
    expect(countSnippetsForCollections).toHaveBeenCalledWith(['col-1'], undefined, undefined);
    // Assert: The returned count should only include public snippets
    expect(result.collections?.[0].snippetCount).toBe(2);
  });

  it('includes viewer-owned private snippets in count for authenticated viewers', async () => {
    // Setup: User "owner" has a public collection with 2 public snippets and 1 private snippet owned by "viewer"
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any],
      count: 1,
    });

    // Mock countSnippetsForCollections to return 3 snippets (2 public + 1 viewer-owned private)
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 3]]));

    // Act: Authenticated viewer requests public collections
    const result = await getUserCollectionsHandler({
      auth: viewer,
      params: { userName: 'owner' },
    });

    // Assert: countSnippetsForCollections was called with viewer's auth0Id
    expect(countSnippetsForCollections).toHaveBeenCalledWith(['col-1'], undefined, 'viewer');
    // Assert: The returned count includes viewer-owned private snippets
    expect(result.collections?.[0].snippetCount).toBe(3);
  });

  it('includes all private snippets in count for collection owner', async () => {
    // Setup: User "owner" has a public collection with 2 public snippets and 2 private snippets
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findMyCollections).mockResolvedValue({
      rows: [publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any],
      count: 1,
    });

    // Mock countSnippetsForCollections to return all 4 snippets for the owner
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 4]]));

    // Act: Collection owner requests their own collections
    const result = await getUserCollectionsHandler({
      auth,
      params: { userName: 'owner' },
    });

    // Assert: countSnippetsForCollections was called with owner's auth0Id
    expect(countSnippetsForCollections).toHaveBeenCalledWith(['col-1'], undefined, 'owner');
    // Assert: The returned count includes all snippets (owner can see all)
    expect(result.collections?.[0].snippetCount).toBe(4);
  });

  it('prevents count disclosure of other users private snippets to unrelated viewers', async () => {
    // Setup: User "owner" has a public collection with 1 public snippet and 2 private snippets owned by "owner"
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any],
      count: 1,
    });

    // Mock countSnippetsForCollections to return only 1 public snippet for unrelated viewer
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 1]]));

    // Act: Unrelated viewer "viewer" requests owner's public collections
    const result = await getUserCollectionsHandler({
      auth: viewer,
      params: { userName: 'owner' },
    });

    // Assert: countSnippetsForCollections was called with viewer's auth0Id
    expect(countSnippetsForCollections).toHaveBeenCalledWith(['col-1'], undefined, 'viewer');
    // Assert: The count should NOT include owner's private snippets
    expect(result.collections?.[0].snippetCount).toBe(1);
    // Assert: The count should be less than what the owner would see (preventing metadata leakage)
    expect(result.collections?.[0].snippetCount).toBeLessThan(3);
  });

  it('applies visibility filtering to multiple collections in a single request', async () => {
    // Setup: User "owner" has 2 public collections with different snippet compositions
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [
        publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any,
        publicCollection({ collectionId: 'col-2', auth0Id: 'owner' }) as any,
      ],
      count: 2,
    });

    // Mock countSnippetsForCollections to return filtered counts for both collections
    // col-1: 2 public snippets (out of 3 total)
    // col-2: 1 public snippet (out of 2 total)
    vi.mocked(countSnippetsForCollections).mockResolvedValue(
      new Map([
        ['col-1', 2],
        ['col-2', 1],
      ])
    );

    // Act: Unauthenticated viewer requests public collections
    const result = await getUserCollectionsHandler({
      auth: undefined,
      params: { userName: 'owner' },
    });

    // Assert: countSnippetsForCollections was called once with both collection IDs
    expect(countSnippetsForCollections).toHaveBeenCalledWith(['col-1', 'col-2'], undefined, undefined);
    // Assert: Each collection has the correct filtered count
    expect(result.collections?.[0].snippetCount).toBe(2);
    expect(result.collections?.[1].snippetCount).toBe(1);
  });

  it('returns zero count for collections with only private snippets when viewed by non-owner', async () => {
    // Setup: User "owner" has a public collection with only private snippets
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findUserPublicCollections).mockResolvedValue({
      rows: [publicCollection({ collectionId: 'col-1', auth0Id: 'owner' }) as any],
      count: 1,
    });

    // Mock countSnippetsForCollections to return 0 for unrelated viewer (all snippets are private)
    vi.mocked(countSnippetsForCollections).mockResolvedValue(new Map([['col-1', 0]]));

    // Act: Unrelated viewer requests public collections
    const result = await getUserCollectionsHandler({
      auth: viewer,
      params: { userName: 'owner' },
    });

    // Assert: The count should be 0 (no visible snippets)
    expect(result.collections?.[0].snippetCount).toBe(0);
  });
});
