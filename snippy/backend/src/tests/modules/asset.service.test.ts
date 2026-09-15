import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs } from '../helpers';
import { featureFlags } from '../../config';
import { MAX_ASSET_SIZE_BYTES } from '../../modules/asset/dto/asset.dto';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../database/minio', () => ({
  minioClient: {
    putObject: vi.fn(),
    removeObject: vi.fn(),
    listObjectsV2: vi.fn(),
  },
  latchMinioUnavailable: vi.fn(),
  isMinioConnectionError: vi.fn().mockReturnValue(false),
}));

vi.mock('../../modules/asset/asset.repo', () => ({
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  findAssetsByUserId: vi.fn(),
  findByAssetId: vi.fn(),
  findByObjectKey: vi.fn(),
  countAssetUsageByNeedle: vi.fn(),
}));

import {
  buildContentUrl,
  uploadFileHandler,
  deleteFileHandler,
  listAssetsHandler,
  deleteUserMinioObjects,
  removeSnippetSnapshot,
} from '../../modules/asset/asset.service';
import { minioClient } from '../../database/minio';
import {
  createAsset,
  deleteAsset,
  findAssetsByUserId,
  findByAssetId,
  findByObjectKey,
  countAssetUsageByNeedle,
} from '../../modules/asset/asset.repo';

const auth = authAs('user-1');
const pngFile = {
  originalname: 'photo.png',
  buffer: Buffer.from('png'),
  mimetype: 'image/png',
};

describe('buildContentUrl', () => {
  it('encodes path segments while keeping slashes', () => {
    expect(buildContentUrl('user-1/general/my file.png')).toBe(
      '/content/user-1/general/my%20file.png'
    );
  });
});

describe('uploadFileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlags.isMinioAvailable = true;
  });

  it('returns 503 when MinIO is unavailable', async () => {
    featureFlags.isMinioAvailable = false;
    await expect(uploadFileHandler({ auth, file: pngFile })).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('rejects files over 5MB', async () => {
    await expect(
      uploadFileHandler({
        auth,
        file: { ...pngFile, buffer: Buffer.alloc(MAX_ASSET_SIZE_BYTES + 1) },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects an unsupported mime type', async () => {
    await expect(
      uploadFileHandler({
        auth,
        file: { ...pngFile, mimetype: 'application/pdf' },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('requires authentication', async () => {
    await expect(uploadFileHandler({ file: pngFile })).rejects.toMatchObject({ statusCode: 401 });
  });

  it('skips DB create for system subfolders', async () => {
    const result = await uploadFileHandler({
      auth,
      file: pngFile,
      body: { subFolder: 'profile' },
    });
    expect(createAsset).not.toHaveBeenCalled();
    expect(result.url).toBe('/content/user-1/profile/photo.png');
  });

  it('overwrites an existing object key', async () => {
    const existing = {
      assetId: 'a1',
      fileType: 'image/jpeg',
      url: '/content/old',
      fileName: 'old.jpg',
      save: vi.fn(),
    };
    vi.mocked(findByObjectKey).mockResolvedValue(existing as any);

    const result = await uploadFileHandler({ auth, file: pngFile });
    expect(existing.save).toHaveBeenCalled();
    expect(createAsset).not.toHaveBeenCalled();
    expect(result.asset?.assetId).toBe('a1');
  });

  it('creates a new asset when the key is new', async () => {
    vi.mocked(findByObjectKey).mockResolvedValue(null);
    vi.mocked(createAsset).mockResolvedValue({
      assetId: 'a2',
      fileName: 'photo.png',
      fileType: 'image/png',
      url: '/content/user-1/general/photo.png',
      objectKey: 'user-1/general/photo.png',
    } as any);

    const result = await uploadFileHandler({ auth, file: pngFile });
    expect(createAsset).toHaveBeenCalled();
    expect(result.asset?.fileName).toBe('photo.png');
  });
});

describe('deleteFileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlags.isMinioAvailable = true;
  });

  it('forbids deleting another user asset', async () => {
    vi.mocked(findByAssetId).mockResolvedValue({
      assetId: 'a1',
      auth0Id: 'other',
      objectKey: 'other/general/x.png',
    } as any);

    await expect(deleteFileHandler({ auth, params: { assetId: 'a1' } })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('forbids an object key that does not match the owner prefix', async () => {
    vi.mocked(findByAssetId).mockResolvedValue({
      assetId: 'a1',
      auth0Id: 'user-1',
      objectKey: 'other/general/x.png',
    } as any);

    await expect(deleteFileHandler({ auth, params: { assetId: 'a1' } })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('deletes MinIO object and DB row', async () => {
    vi.mocked(findByAssetId).mockResolvedValue({
      assetId: 'a1',
      auth0Id: 'user-1',
      objectKey: 'user-1/general/x.png',
    } as any);

    const result = await deleteFileHandler({ auth, params: { assetId: 'a1' } });
    expect(minioClient.removeObject).toHaveBeenCalled();
    expect(deleteAsset).toHaveBeenCalledWith('a1', undefined);
    expect(result.message).toBe('File deleted successfully');
  });
});

describe('listAssetsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlags.isMinioAvailable = true;
  });

  it('attaches usedInCount from the usage map', async () => {
    vi.mocked(findAssetsByUserId).mockResolvedValue({
      rows: [
        {
          assetId: 'a1',
          fileName: 'x.png',
          fileType: 'image/png',
          url: '/content/user-1/general/x.png',
          objectKey: 'user-1/general/x.png',
        },
      ],
      count: 1,
    } as any);
    vi.mocked(countAssetUsageByNeedle).mockResolvedValue(
      new Map([
        ['/content/user-1/general/x.png', 2],
        ['user-1/general/x.png', 5],
      ])
    );

    const result = await listAssetsHandler({ auth });
    expect(result.assets?.[0].usedInCount).toBe(5);
    expect(result.totalCount).toBe(1);
  });
});

describe('MinIO cleanup helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlags.isMinioAvailable = true;
  });

  it('does not throw when MinIO is unavailable', async () => {
    featureFlags.isMinioAvailable = false;
    await expect(deleteUserMinioObjects('user-1')).resolves.toBeUndefined();
    await expect(removeSnippetSnapshot('user-1', 'uuid-1')).resolves.toBeUndefined();
    expect(minioClient.removeObject).not.toHaveBeenCalled();
  });

  it('removes listed objects for a user prefix', async () => {
    vi.mocked(minioClient.listObjectsV2).mockImplementation(() => {
      const stream = new EventEmitter();
      queueMicrotask(() => {
        stream.emit('data', { name: 'user-1/general/a.png' });
        stream.emit('data', { name: 'user-1/general/b.png' });
        stream.emit('end');
      });
      return stream as any;
    });

    await deleteUserMinioObjects('user-1');
    expect(minioClient.removeObject).toHaveBeenCalledTimes(2);
  });
});
