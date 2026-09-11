import { describe, expect, it } from 'vitest';
import {
  isSystemSubFolder,
  isSystemObjectKey,
  snippetSnapshotObjectKey,
} from '../../modules/asset/dto/asset.dto';

describe('asset dto helpers', () => {
  it('identifies system subfolders', () => {
    expect(isSystemSubFolder('profile')).toBe(true);
    expect(isSystemSubFolder('snippets')).toBe(true);
    expect(isSystemSubFolder('general')).toBe(false);
  });

  it('identifies system object keys', () => {
    expect(isSystemObjectKey('user-1', 'user-1/profile/avatar.png')).toBe(true);
    expect(isSystemObjectKey('user-1', 'user-1/snippets/uuid.jpg')).toBe(true);
    expect(isSystemObjectKey('user-1', 'user-1/general/x.png')).toBe(false);
  });

  it('builds the snapshot object key', () => {
    expect(snippetSnapshotObjectKey('user-1', 'snip-1')).toBe('user-1/snippets/snip-1.jpg');
  });
});
