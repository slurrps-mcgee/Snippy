import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Op } from 'sequelize';

vi.mock('../../entities/follow.entity', () => ({
  Follows: {
    findAndCountAll: vi.fn(),
  },
}));

import { findFollowers, findFollowing } from '../../modules/follow/follow.repo';
import { Follows } from '../../entities/follow.entity';

describe('Privacy bypass mitigation - findFollowers repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters private users when requestingAuth0Id is provided', async () => {
    const mockFollows = [
      {
        follower: {
          auth0Id: 'user-public',
          userName: 'public_user',
          displayName: 'Public User',
          bio: 'Public bio',
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    await findFollowers('target-user', 0, 10, undefined, 'requesting-user');

    // Verify the query includes the privacy filter with Op.or
    expect(Follows.findAndCountAll).toHaveBeenCalledWith({
      where: { followingAuth0Id: 'target-user' },
      include: [
        {
          model: expect.anything(),
          as: 'follower',
          attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl', 'isPrivate'],
          where: {
            [Op.or]: [
              { isPrivate: false },
              { auth0Id: 'requesting-user' }
            ]
          },
        },
      ],
      order: [['created_at', 'DESC']],
      offset: 0,
      limit: 10,
      transaction: undefined,
      distinct: true,
    });
  });

  it('filters to only public users when requestingAuth0Id is not provided', async () => {
    const mockFollows = [
      {
        follower: {
          auth0Id: 'user-public',
          userName: 'public_user',
          displayName: 'Public User',
          bio: 'Public bio',
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    await findFollowers('target-user', 0, 10, undefined, undefined);

    // Verify the query only includes public users
    expect(Follows.findAndCountAll).toHaveBeenCalledWith({
      where: { followingAuth0Id: 'target-user' },
      include: [
        {
          model: expect.anything(),
          as: 'follower',
          attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl', 'isPrivate'],
          where: { isPrivate: false },
        },
      ],
      order: [['created_at', 'DESC']],
      offset: 0,
      limit: 10,
      transaction: undefined,
      distinct: true,
    });
  });

  it('includes isPrivate in the selected attributes', async () => {
    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: [] as any,
      count: 0,
    });

    await findFollowers('target-user', 0, 10, undefined, 'requesting-user');

    const callArgs = vi.mocked(Follows.findAndCountAll).mock.calls[0][0];
    const includeConfig = callArgs.include?.[0] as any;
    
    // Verify isPrivate is included in attributes (needed for filtering)
    expect(includeConfig.attributes).toContain('isPrivate');
  });

  it('allows private users to see themselves in results', async () => {
    const mockFollows = [
      {
        follower: {
          auth0Id: 'requesting-user',
          userName: 'private_self',
          displayName: 'Private Self',
          bio: 'My private bio',
          pictureUrl: null,
          isPrivate: true,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    const result = await findFollowers('target-user', 0, 10, undefined, 'requesting-user');

    // Verify the query was called with the correct filter
    expect(Follows.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          expect.objectContaining({
            where: {
              [Op.or]: [
                { isPrivate: false },
                { auth0Id: 'requesting-user' }
              ]
            },
          }),
        ],
      })
    );

    // Verify the result includes the private user (themselves)
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].auth0Id).toBe('requesting-user');
    expect(result.rows[0].isPrivate).toBe(true);
  });
});

describe('Privacy bypass mitigation - findFollowing repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters private users when requestingAuth0Id is provided', async () => {
    const mockFollows = [
      {
        following: {
          auth0Id: 'user-public',
          userName: 'public_user',
          displayName: 'Public User',
          bio: 'Public bio',
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    await findFollowing('follower-user', 0, 10, undefined, 'requesting-user');

    // Verify the query includes the privacy filter with Op.or
    expect(Follows.findAndCountAll).toHaveBeenCalledWith({
      where: { followerAuth0Id: 'follower-user' },
      include: [
        {
          model: expect.anything(),
          as: 'following',
          attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl', 'isPrivate'],
          where: {
            [Op.or]: [
              { isPrivate: false },
              { auth0Id: 'requesting-user' }
            ]
          },
        },
      ],
      order: [['created_at', 'DESC']],
      offset: 0,
      limit: 10,
      transaction: undefined,
      distinct: true,
    });
  });

  it('filters to only public users when requestingAuth0Id is not provided', async () => {
    const mockFollows = [
      {
        following: {
          auth0Id: 'user-public',
          userName: 'public_user',
          displayName: 'Public User',
          bio: 'Public bio',
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    await findFollowing('follower-user', 0, 10, undefined, undefined);

    // Verify the query only includes public users
    expect(Follows.findAndCountAll).toHaveBeenCalledWith({
      where: { followerAuth0Id: 'follower-user' },
      include: [
        {
          model: expect.anything(),
          as: 'following',
          attributes: ['auth0Id', 'userName', 'displayName', 'bio', 'pictureUrl', 'isPrivate'],
          where: { isPrivate: false },
        },
      ],
      order: [['created_at', 'DESC']],
      offset: 0,
      limit: 10,
      transaction: undefined,
      distinct: true,
    });
  });

  it('includes isPrivate in the selected attributes', async () => {
    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: [] as any,
      count: 0,
    });

    await findFollowing('follower-user', 0, 10, undefined, 'requesting-user');

    const callArgs = vi.mocked(Follows.findAndCountAll).mock.calls[0][0];
    const includeConfig = callArgs.include?.[0] as any;
    
    // Verify isPrivate is included in attributes (needed for filtering)
    expect(includeConfig.attributes).toContain('isPrivate');
  });

  it('allows private users to see themselves in results', async () => {
    const mockFollows = [
      {
        following: {
          auth0Id: 'requesting-user',
          userName: 'private_self',
          displayName: 'Private Self',
          bio: 'My private bio',
          pictureUrl: null,
          isPrivate: true,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 1,
    });

    const result = await findFollowing('follower-user', 0, 10, undefined, 'requesting-user');

    // Verify the query was called with the correct filter
    expect(Follows.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          expect.objectContaining({
            where: {
              [Op.or]: [
                { isPrivate: false },
                { auth0Id: 'requesting-user' }
              ]
            },
          }),
        ],
      })
    );

    // Verify the result includes the private user (themselves)
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].auth0Id).toBe('requesting-user');
    expect(result.rows[0].isPrivate).toBe(true);
  });

  it('correctly maps following users from relationship rows', async () => {
    const mockFollows = [
      {
        following: {
          auth0Id: 'user-1',
          userName: 'user1',
          displayName: 'User One',
          bio: 'Bio 1',
          pictureUrl: null,
          isPrivate: false,
        },
      },
      {
        following: {
          auth0Id: 'user-2',
          userName: 'user2',
          displayName: 'User Two',
          bio: 'Bio 2',
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 2,
    });

    const result = await findFollowing('follower-user', 0, 10, undefined, undefined);

    // Verify the users are correctly extracted from the relationship
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].userName).toBe('user1');
    expect(result.rows[1].userName).toBe('user2');
    expect(result.count).toBe(2);
  });
});

describe('Privacy bypass mitigation - edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty results correctly', async () => {
    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: [] as any,
      count: 0,
    });

    const result = await findFollowers('target-user', 0, 10, undefined, 'requesting-user');

    expect(result.rows).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('filters out null follower entries', async () => {
    const mockFollows = [
      { follower: null },
      {
        follower: {
          auth0Id: 'user-1',
          userName: 'user1',
          displayName: 'User One',
          bio: null,
          pictureUrl: null,
          isPrivate: false,
        },
      },
    ];

    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: mockFollows as any,
      count: 2,
    });

    const result = await findFollowers('target-user', 0, 10, undefined, undefined);

    // Verify null entries are filtered out
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].userName).toBe('user1');
  });

  it('respects pagination parameters', async () => {
    vi.mocked(Follows.findAndCountAll).mockResolvedValue({
      rows: [] as any,
      count: 0,
    });

    await findFollowers('target-user', 20, 50, undefined, 'requesting-user');

    expect(Follows.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 20,
        limit: 50,
      })
    );
  });
});
