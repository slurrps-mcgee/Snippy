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
