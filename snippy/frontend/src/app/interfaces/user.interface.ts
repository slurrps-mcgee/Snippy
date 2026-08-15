import { Assets } from './asset.interface';
import { EditorPreferences } from '@app/editor/editor-preferences';

export interface User {
  userName: string;
  displayName: string | null;
  bio?: string | null;
  pictureUrl?: string | null;
  isPrivate?: boolean;
  editorPreferences?: EditorPreferences;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  assets?: Assets[];
}
