import { Assets } from './asset.interface';

export interface User {
  userName: string;
  displayName: string | null;
  bio?: string | null;
  pictureUrl?: string | null;
  isAdmin?: boolean;
  isPrivate?: boolean;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  assets?: Assets[];
}
