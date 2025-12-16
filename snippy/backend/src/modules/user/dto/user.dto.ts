/**
 * User Data Transfer Objects
 */

export interface UserDTO {
    userName: string;
    displayName: string | null;
    bio: string | null;
    pictureUrl: string | null;
    isAdmin?: boolean;
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
    pictureUrl?: string;
    isPrivate?: boolean;
}

export interface EnsureUserRequest {
    name?: string;
    pictureUrl?: string;
}
