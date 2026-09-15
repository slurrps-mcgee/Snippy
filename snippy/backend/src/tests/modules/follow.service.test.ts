import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicUser } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/follow/follow.repo', () => ({
  createFollow: vi.fn(),
  deleteFollow: vi.fn(),
  findFollow: vi.fn(),
  findFollowers: vi.fn(),
  findFollowing: vi.fn(),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findByUsername: vi.fn(),
}));

import {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
} from '../../modules/follow/follow.service';
import {
  createFollow,
  deleteFollow,
  findFollow,
  findFollowers,
  findFollowing,
} from '../../modules/follow/follow.repo';
import { findByUsername } from '../../modules/user/user.repo';

const auth = authAs('user-1');
const target = publicUser({ auth0Id: 'user-2', userName: 'bob', displayName: 'Bob' });

describe('followUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(followUserHandler({ params: { userName: 'bob' } })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('requires a username', async () => {
    await expect(followUserHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 404 when the target is missing', async () => {
    vi.mocked(findByUsername).mockResolvedValue(null);
    await expect(followUserHandler({ auth, params: { userName: 'bob' } })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('forbids following yourself', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser() as any);
    await expect(followUserHandler({ auth, params: { userName: 'alice' } })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('forbids following a private profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'user-2', isPrivate: true }) as any
    );
    await expect(followUserHandler({ auth, params: { userName: 'bob' } })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('returns already following when a row exists', async () => {
    vi.mocked(findByUsername).mockResolvedValue(target as any);
    vi.mocked(findFollow).mockResolvedValue({ followId: 'f1' } as any);

    const result = await followUserHandler({ auth, params: { userName: 'bob' } });
    expect(createFollow).not.toHaveBeenCalled();
    expect(result.isFollowing).toBe(true);
    expect(result.message).toBe('Already following');
  });

  it('creates a follow', async () => {
    vi.mocked(findByUsername).mockResolvedValue(target as any);
    vi.mocked(findFollow).mockResolvedValue(null);

    const result = await followUserHandler({ auth, params: { userName: 'bob' } });
    expect(createFollow).toHaveBeenCalledWith('user-1', 'user-2', undefined);
    expect(result.isFollowing).toBe(true);
  });
});

describe('unfollowUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when the target is missing', async () => {
    vi.mocked(findByUsername).mockResolvedValue(null);
    await expect(unfollowUserHandler({ auth, params: { userName: 'bob' } })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('unfollows a user', async () => {
    vi.mocked(findByUsername).mockResolvedValue(target as any);
    const result = await unfollowUserHandler({ auth, params: { userName: 'bob' } });
    expect(deleteFollow).toHaveBeenCalledWith('user-1', 'user-2', undefined);
    expect(result.isFollowing).toBe(false);
  });
});

describe('getFollowersHandler and getFollowingHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids listing followers of a private profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'user-2', isPrivate: true }) as any
    );
    await expect(getFollowersHandler({ auth, params: { userName: 'bob' } })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows the owner to list followers of a private profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'user-1', isPrivate: true }) as any
    );
    vi.mocked(findFollowers).mockResolvedValue({ rows: [target as any], count: 1 });

    const result = await getFollowersHandler({
      auth,
      params: { userName: 'alice' },
      query: { page: 1, limit: 10 },
    });
    expect(result.totalCount).toBe(1);
    expect(result.users?.[0].userName).toBe('bob');
  });

  it('lists following for a public profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(target as any);
    vi.mocked(findFollowing).mockResolvedValue({
      rows: [publicUser() as any],
      count: 1,
    });

    const result = await getFollowingHandler({ params: { userName: 'bob' } });
    expect(result.totalCount).toBe(1);
    expect(findFollowing).toHaveBeenCalled();
  });

  it('requires a username', async () => {
    await expect(getFollowingHandler({})).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('Privacy bypass mitigation - getFollowersHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes requestingAuth0Id to findFollowers when authenticated', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    vi.mocked(findFollowers).mockResolvedValue({ rows: [], count: 0 });

    await getFollowersHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify that requestingAuth0Id is passed to the repository function
    expect(findFollowers).toHaveBeenCalledWith(
      'user-2',
      0,
      10,
      undefined,
      'user-1'
    );
  });

  it('passes undefined requestingAuth0Id to findFollowers when unauthenticated', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    vi.mocked(findFollowers).mockResolvedValue({ rows: [], count: 0 });

    await getFollowersHandler({
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify that requestingAuth0Id is undefined for unauthenticated requests
    expect(findFollowers).toHaveBeenCalledWith(
      'user-2',
      0,
      10,
      undefined,
      undefined
    );
  });

  it('does not expose private user profiles in followers list to unrelated users', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    const privateFollower = publicUser({ 
      auth0Id: 'user-3', 
      userName: 'charlie', 
      displayName: 'Charlie Private',
      bio: 'Secret bio',
      isPrivate: true 
    });
    
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    // The repository should filter out private users, so we simulate that
    vi.mocked(findFollowers).mockResolvedValue({ rows: [], count: 0 });

    const result = await getFollowersHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify the repository was called with the requesting user's auth0Id
    expect(findFollowers).toHaveBeenCalledWith('user-2', 0, 10, undefined, 'user-1');
    
    // The result should not contain private users (repository filters them)
    expect(result.users).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('allows private users to see themselves in followers list', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    const privateFollowerSelf = publicUser({ 
      auth0Id: 'user-1', 
      userName: 'alice', 
      displayName: 'Alice Private',
      isPrivate: true 
    });
    
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    // When the private user queries, they should see themselves
    vi.mocked(findFollowers).mockResolvedValue({ 
      rows: [privateFollowerSelf as any], 
      count: 1 
    });

    const result = await getFollowersHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify the repository was called with the requesting user's auth0Id
    expect(findFollowers).toHaveBeenCalledWith('user-2', 0, 10, undefined, 'user-1');
    
    // The result should contain the private user (themselves)
    expect(result.users).toHaveLength(1);
    expect(result.users?.[0].userName).toBe('alice');
    expect(result.totalCount).toBe(1);
  });
});

describe('Privacy bypass mitigation - getFollowingHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes requestingAuth0Id to findFollowing when authenticated', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    vi.mocked(findFollowing).mockResolvedValue({ rows: [], count: 0 });

    await getFollowingHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify that requestingAuth0Id is passed to the repository function
    expect(findFollowing).toHaveBeenCalledWith(
      'user-2',
      0,
      10,
      undefined,
      'user-1'
    );
  });

  it('passes undefined requestingAuth0Id to findFollowing when unauthenticated', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    vi.mocked(findFollowing).mockResolvedValue({ rows: [], count: 0 });

    await getFollowingHandler({
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify that requestingAuth0Id is undefined for unauthenticated requests
    expect(findFollowing).toHaveBeenCalledWith(
      'user-2',
      0,
      10,
      undefined,
      undefined
    );
  });

  it('does not expose private user profiles in following list to unrelated users', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    const privateFollowing = publicUser({ 
      auth0Id: 'user-3', 
      userName: 'charlie', 
      displayName: 'Charlie Private',
      bio: 'Secret bio',
      isPrivate: true 
    });
    
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    // The repository should filter out private users, so we simulate that
    vi.mocked(findFollowing).mockResolvedValue({ rows: [], count: 0 });

    const result = await getFollowingHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify the repository was called with the requesting user's auth0Id
    expect(findFollowing).toHaveBeenCalledWith('user-2', 0, 10, undefined, 'user-1');
    
    // The result should not contain private users (repository filters them)
    expect(result.users).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('allows private users to see themselves in following list', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    const privateFollowingSelf = publicUser({ 
      auth0Id: 'user-1', 
      userName: 'alice', 
      displayName: 'Alice Private',
      isPrivate: true 
    });
    
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    // When the private user queries, they should see themselves
    vi.mocked(findFollowing).mockResolvedValue({ 
      rows: [privateFollowingSelf as any], 
      count: 1 
    });

    const result = await getFollowingHandler({
      auth,
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify the repository was called with the requesting user's auth0Id
    expect(findFollowing).toHaveBeenCalledWith('user-2', 0, 10, undefined, 'user-1');
    
    // The result should contain the private user (themselves)
    expect(result.users).toHaveLength(1);
    expect(result.users?.[0].userName).toBe('alice');
    expect(result.totalCount).toBe(1);
  });

  it('exposes only public users in following list to unauthenticated requests', async () => {
    const publicTarget = publicUser({ auth0Id: 'user-2', userName: 'bob', isPrivate: false });
    const publicFollowing = publicUser({ 
      auth0Id: 'user-4', 
      userName: 'dave', 
      displayName: 'Dave Public',
      isPrivate: false 
    });
    
    vi.mocked(findByUsername).mockResolvedValue(publicTarget as any);
    // Repository should only return public users for unauthenticated requests
    vi.mocked(findFollowing).mockResolvedValue({ 
      rows: [publicFollowing as any], 
      count: 1 
    });

    const result = await getFollowingHandler({
      params: { userName: 'bob' },
      query: { page: 1, limit: 10 },
    });

    // Verify the repository was called without requestingAuth0Id
    expect(findFollowing).toHaveBeenCalledWith('user-2', 0, 10, undefined, undefined);
    
    // The result should only contain public users
    expect(result.users).toHaveLength(1);
    expect(result.users?.[0].userName).toBe('dave');
    expect(result.totalCount).toBe(1);
  });
});
