/**
 * User Data Transfer Objects
 */

import { EditorPreferences } from '../../../common/utilities/editor-preferences';
import { AssetDTO } from '../../asset/dto/asset.dto';

export type { AssetDTO };

export interface UserDTO {
  userName: string;
  displayName: string | null;
  bio: string | null;
  pictureUrl: string | null;
  isPrivate?: boolean;
  editorPreferences?: EditorPreferences;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  assets?: AssetDTO[];
}

export interface CreateUserRequest {
  auth0Id: string;
  userName?: string;
  displayName?: string;
  bio?: string | null;
  pictureUrl?: string;
}

export interface UpdateUserRequest {
  userName?: string;
  displayName?: string;
  bio?: string | null;
  pictureUrl?: string | null;
  isPrivate?: boolean;
  editorPreferences?: Partial<EditorPreferences>;
}

export interface EnsureUserRequest {
  name?: string;
  pictureUrl?: string;
}
