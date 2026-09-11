import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicUser } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/user/user.repo', () => ({
  findById: vi.fn(),
  findByUsername: vi.fn(),
  updateUser: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../../modules/follow/follow.repo', () => ({
  countFollowers: vi.fn(),
  countFollowing: vi.fn(),
  findFollow: vi.fn(),
}));

vi.mock('../../modules/asset/asset.service', () => ({
  deleteUserMinioObjects: vi.fn(),
  uploadFileHandler: vi.fn(),
}));

import {
  ensureUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getUserProfileHandler,
  getCurrentUserHandler,
  updateProfilePictureHandler,
  checkUserNameAvailabilityHandler,
} from '../../modules/user/user.service';
import {
  findById,
  findByUsername,
  updateUser,
  createUser,
  deleteUser,
} from '../../modules/user/user.repo';
import { countFollowers, countFollowing, findFollow } from '../../modules/follow/follow.repo';
import { deleteUserMinioObjects, uploadFileHandler } from '../../modules/asset/asset.service';

const auth = authAs('user-1');

describe('ensureUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(ensureUserHandler({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('creates a user when none exists', async () => {
    vi.mocked(findById)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(publicUser() as any);
    vi.mocked(createUser).mockResolvedValue(publicUser() as any);

    const result = await ensureUserHandler({
      auth,
      body: { name: 'Alice', pictureUrl: 'https://example.com/a.png' },
    });
    expect(createUser).toHaveBeenCalled();
    expect(result.created).toBe(true);
    expect(result.user?.userName).toBe('alice');
  });

  it('syncs Auth0 picture unless a MinIO avatar is already set', async () => {
    vi.mocked(findById)
      .mockResolvedValueOnce(publicUser({ pictureUrl: 'https://auth0.example/old.png' }) as any)
      .mockResolvedValueOnce(publicUser({ pictureUrl: 'https://auth0.example/new.png' }) as any);

    await ensureUserHandler({
      auth,
      body: { pictureUrl: 'https://auth0.example/new.png' },
    });
    expect(updateUser).toHaveBeenCalledWith(
      'user-1',
      { pictureUrl: 'https://auth0.example/new.png' },
      undefined
    );
  });

  it('does not overwrite a MinIO avatar with Auth0 picture', async () => {
    vi.mocked(findById)
      .mockResolvedValueOnce(
        publicUser({ pictureUrl: '/content/user-1/profile/avatar.png' }) as any
      )
      .mockResolvedValueOnce(
        publicUser({ pictureUrl: '/content/user-1/profile/avatar.png' }) as any
      );

    await ensureUserHandler({
      auth,
      body: { pictureUrl: 'https://auth0.example/new.png' },
    });
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe('updateUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(updateUserHandler({ body: { displayName: 'A' } })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('requires a patch body', async () => {
    await expect(updateUserHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('strips protected fields, nulls empty pictureUrl, and merges editor prefs', async () => {
    vi.mocked(findById)
      .mockResolvedValueOnce(
        publicUser({ editorPreferences: { fontSize: 18, theme: 'dracula' } }) as any
      )
      .mockResolvedValueOnce(publicUser({ displayName: 'Updated' }) as any);

    const body: Record<string, unknown> = {
      displayName: 'Updated',
      pictureUrl: '',
      auth0Id: 'hacker',
      isAdmin: true,
      editorPreferences: { keymap: 'vim' },
    };

    await updateUserHandler({ auth, body: body as any });
    expect(updateUser).toHaveBeenCalled();
    const patch = vi.mocked(updateUser).mock.calls[0][1] as Record<string, unknown>;
    expect(patch.auth0Id).toBeUndefined();
    expect(patch.isAdmin).toBeUndefined();
    expect(patch.pictureUrl).toBeNull();
    expect(patch.editorPreferences).toMatchObject({
      fontSize: 18,
      theme: 'dracula',
      keymap: 'vim',
    });
  });

  it('returns 404 when the user is missing', async () => {
    vi.mocked(findById).mockResolvedValue(null);
    await expect(updateUserHandler({ auth, body: { displayName: 'A' } })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('deleteUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(deleteUserHandler({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns 404 when the user is missing', async () => {
    vi.mocked(findById).mockResolvedValue(null);
    await expect(deleteUserHandler({ auth })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('cleans MinIO objects then deletes the user', async () => {
    vi.mocked(findById).mockResolvedValue(publicUser() as any);
    const result = await deleteUserHandler({ auth });
    expect(deleteUserMinioObjects).toHaveBeenCalledWith('user-1');
    expect(deleteUser).toHaveBeenCalledWith('user-1', undefined);
    expect(result.message).toBe('User deleted successfully');
  });
});

describe('getUserProfileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(countFollowers).mockResolvedValue(2);
    vi.mocked(countFollowing).mockResolvedValue(3);
    vi.mocked(findFollow).mockResolvedValue(null);
  });

  it('requires a username', async () => {
    await expect(getUserProfileHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 404 when the user is missing', async () => {
    vi.mocked(findByUsername).mockResolvedValue(null);
    await expect(
      getUserProfileHandler({ auth, params: { userName: 'missing' } })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('forbids reading another user private profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(
      publicUser({ auth0Id: 'owner', isPrivate: true }) as any
    );
    await expect(
      getUserProfileHandler({ auth, params: { userName: 'owner' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns follower counts and following status for a public profile', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser({ auth0Id: 'owner' }) as any);
    vi.mocked(findFollow).mockResolvedValue({ followId: 'f1' } as any);

    const result = await getUserProfileHandler({ auth, params: { userName: 'alice' } });
    expect(result.user?.followerCount).toBe(2);
    expect(result.user?.followingCount).toBe(3);
    expect(result.user?.isFollowing).toBe(true);
  });
});

describe('getCurrentUserHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(getCurrentUserHandler({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns 404 when the user is missing', async () => {
    vi.mocked(findById).mockResolvedValue(null);
    await expect(getCurrentUserHandler({ auth })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the current user DTO', async () => {
    vi.mocked(findById).mockResolvedValue(publicUser() as any);
    vi.mocked(countFollowers).mockResolvedValue(1);
    vi.mocked(countFollowing).mockResolvedValue(4);

    const result = await getCurrentUserHandler({ auth });
    expect(result.user?.userName).toBe('alice');
    expect(result.user?.isPrivate).toBe(false);
    expect(result.user?.followerCount).toBe(1);
  });
});

describe('updateProfilePictureHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    await expect(
      updateProfilePictureHandler({ file: { mimetype: 'image/png', buffer: Buffer.from('x') } })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('requires a file', async () => {
    await expect(updateProfilePictureHandler({ auth })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects an unsupported mime type', async () => {
    await expect(
      updateProfilePictureHandler({
        auth,
        file: { mimetype: 'application/pdf', buffer: Buffer.from('x') },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('uploads an avatar and stores the returned url', async () => {
    vi.mocked(uploadFileHandler).mockResolvedValue({ url: '/content/user-1/profile/avatar.png' });
    vi.mocked(findById).mockResolvedValue(
      publicUser({ pictureUrl: '/content/user-1/profile/avatar.png' }) as any
    );

    const payload = {
      auth,
      file: { mimetype: 'image/png', buffer: Buffer.from('x'), originalname: 'photo.png' },
    };
    const result = await updateProfilePictureHandler(payload);
    expect(payload.file.originalname).toBe('avatar.png');
    expect(payload.body).toEqual({ subFolder: 'profile' });
    expect(updateUser).toHaveBeenCalledWith(
      'user-1',
      { pictureUrl: '/content/user-1/profile/avatar.png' },
      undefined
    );
    expect(result.user?.pictureUrl).toBe('/content/user-1/profile/avatar.png');
  });
});

describe('checkUserNameAvailabilityHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects reserved usernames', async () => {
    await expect(
      checkUserNameAvailabilityHandler({ params: { userName: 'snippet' } })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns available when no user exists', async () => {
    vi.mocked(findByUsername).mockResolvedValue(null);
    const result = await checkUserNameAvailabilityHandler({ params: { userName: 'alice' } });
    expect(result.available).toBe(true);
  });

  it('returns unavailable when a user exists', async () => {
    vi.mocked(findByUsername).mockResolvedValue(publicUser() as any);
    const result = await checkUserNameAvailabilityHandler({ params: { userName: 'alice' } });
    expect(result.available).toBe(false);
  });
});
