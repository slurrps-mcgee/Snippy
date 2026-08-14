/**
 * User Data Transfer Objects
 */

import { EditorPreferences } from '../../../common/utilities/editor-preferences';

export interface UserDTO {
    userName: string;
    displayName: string | null;
    bio: string | null;
    pictureUrl: string | null;
    isAdmin?: boolean;
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
    isAdmin?: boolean;
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

export interface AssetDTO {
    assetId: string;
    fileName: string;
    fileType: string;
    url: string;
    objectKey?: string;
}