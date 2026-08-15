import { CustomError } from "../../common/exceptions/custom-error";
import { UserMapper } from "./user.mapper";
import { UserDTO, EnsureUserRequest, UpdateUserRequest } from "./dto/user.dto";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { findById, findByUsername, updateUser, createUser, deleteUser } from "./user.repo";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { AuthorizationService } from "../../common/services/authorization.service";
import { config } from "../../config";
import { deleteUserMinioObjects, uploadFileHandler } from "../asset/asset.service";
import { countFollowers, countFollowing, findFollow } from "../follow/follow.repo";
import { mergeEditorPreferences } from "../../common/utilities/editor-preferences";
/**
 * Protected fields that cannot be updated through the updateUser endpoint
 * These fields are system-managed and should not be modified by users
 */
const PROTECTED_USER_FIELDS = ['auth0Id', 'isAdmin'] as const;

export async function ensureUserHandler(payload: ServicePayload<EnsureUserRequest>): Promise<ServiceResponse<UserDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
        throw new CustomError("Authentication required", 401);
    }

    let created = false;

    try {
        return await executeInTransaction(async (t) => {
            let user = await findById(auth0Id, t);

            // Check if the user exists
            if (user) {
                AuthorizationService.verifyOwnership(auth0Id, user.auth0Id, 'user'); // just to confirm ownership

                // incoming values from Auth0 profile (you already extract these)
                const pictureUrl = payload?.body?.pictureUrl;

                // Build a patch only for allowed fields
                const patch: any = {};

                // Sync Auth0 picture unless the user already uploaded a MinIO avatar
                if (pictureUrl && pictureUrl !== user.pictureUrl) {
                    const isMinioPicture = (user.pictureUrl ?? '').startsWith('/content/');
                    if (!isMinioPicture) {
                        patch.pictureUrl = pictureUrl;
                    }
                }

                if (Object.keys(patch).length) {
                    // call your update routine that sanitizes the result
                    await updateUser(auth0Id, patch, t);
                }
            }
            else {
                const details = {
                    name: payload?.body?.name,
                    pictureUrl: payload?.body?.pictureUrl
                }

                const createdUser = await createUser({
                    auth0Id: auth0Id,
                    userName: details.name || '',
                    displayName: details.name,
                    bio: null,
                    pictureUrl: details.pictureUrl,
                    isAdmin: false
                } as any, t);

                if (!createdUser) throw new CustomError('Failed to create user', 500);

                created = true;
            }

            // Fetch the user again to return
            user = await findById(auth0Id, t);

            if (!user) {
                throw new CustomError('User not found after ensure', 500);
            }

            // Return user and created flag
            return { user: UserMapper.toDTO(user, true), created };
        }, 'ensureUser');
    } catch (err: any) {
        handleError(err, 'ensureUserHandler');
    }
}

export async function updateUserHandler(payload: ServicePayload<UpdateUserRequest>): Promise<ServiceResponse<UserDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
        throw new CustomError("Authentication required", 401);
    }

    // Prevent updating sensitive fields from this endpoint
    const patch = payload.body;

    if (patch) {
        // Remove protected fields to prevent unauthorized modifications
        PROTECTED_USER_FIELDS.forEach(field => {
            delete (patch as any)[field];
        });
    }

    if (!patch) {
        throw new CustomError('No update data provided', 400);
    }

    try {
        return await executeInTransaction(async (t) => {
            const existing = await findById(auth0Id, t);
            if (!existing) {
                throw new CustomError('User not found', 404);
            }

            const updatePatch: Record<string, unknown> = { ...patch };
            if (patch.pictureUrl === '') {
                updatePatch.pictureUrl = null;
            }
            if (patch.editorPreferences) {
                updatePatch.editorPreferences = mergeEditorPreferences({
                    ...(existing.editorPreferences as object | null),
                    ...patch.editorPreferences,
                });
            }

            await updateUser(auth0Id, updatePatch as any, t);

            // Get complete user data then sanitize for frontend response
            const user = await findById(auth0Id, t);

            if (!user) {
                throw new CustomError('User not found after update', 404);
            }

            return { user: UserMapper.toDTO(user, true) };
        });
    } catch (err: any) {
        handleError(err, 'updateUserHandler');
    }
}

export async function deleteUserHandler(payload: ServicePayload<unknown>): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        if (!auth0Id) {
            throw new CustomError('Unauthorized', 401);
        }

        const user = await findById(auth0Id);
        if (!user) {
            throw new CustomError('User not found', 404);
        }

        // Remove MinIO objects before DB CASCADE deletes asset rows
        await deleteUserMinioObjects(auth0Id);

        return await executeInTransaction(async (t) => {
            await deleteUser(auth0Id, t);
            return { message: 'User deleted successfully' };
        });
    } catch (err: any) {
        handleError(err, 'deleteUserHandler');
    }
}

export async function getUserProfileHandler(payload: ServicePayload<unknown, { userName: string }>): Promise<ServiceResponse<UserDTO>> {
    try {
        const userName = payload.params?.userName;
        const auth0Id = payload.auth?.payload?.sub;

        if (!userName) {
            throw new CustomError("Username required", 400);
        }

        return await executeInTransaction(async (t) => {
            const user = await findByUsername(userName, t);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            if (user.isPrivate && user.auth0Id !== auth0Id) {
                throw new CustomError('User profile is private', 403);
            }

            const [followerCount, followingCount, followRow] = await Promise.all([
                countFollowers(user.auth0Id, t),
                countFollowing(user.auth0Id, t),
                auth0Id && auth0Id !== user.auth0Id
                    ? findFollow(auth0Id, user.auth0Id, t)
                    : Promise.resolve(null),
            ]);

            return {
                user: UserMapper.toDTO(user, user.auth0Id === auth0Id, {
                    followerCount,
                    followingCount,
                    isFollowing: auth0Id && auth0Id !== user.auth0Id ? !!followRow : undefined,
                }),
            };
        });
    } catch (err: any) {
        handleError(err, 'getUserProfileHandler');
    }
}

export async function getCurrentUserHandler(payload: ServicePayload<unknown>): Promise<ServiceResponse<UserDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        if (!auth0Id) {
            throw new CustomError('Unauthorized', 401);
        }

        return await executeInTransaction(async (t) => {
            const user = await findById(auth0Id, t);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            const [followerCount, followingCount] = await Promise.all([
                countFollowers(user.auth0Id, t),
                countFollowing(user.auth0Id, t),
            ]);

            return {
                user: UserMapper.toDTO(user, true, { followerCount, followingCount }),
            };
        });
    } catch (err: any) {
        handleError(err, 'getCurrentUserHandler');
    }
}

export async function updateProfilePictureHandler(
    payload: ServicePayload<{ subFolder?: string }>
): Promise<ServiceResponse<UserDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
        throw new CustomError('Authentication required', 401);
    }

    if (!payload.file) {
        throw new CustomError('No file uploaded', 400);
    }

    const ext = mimeToAvatarExtension(payload.file.mimetype);
    if (!ext) {
        throw new CustomError('Unsupported file type. Allowed: png, jpeg, gif, webp, svg', 400);
    }

    payload.file.originalname = `avatar${ext}`;
    payload.body = { subFolder: 'profile' };

    const uploaded = await uploadFileHandler(payload);
    const pictureUrl = uploaded.url as string | undefined;
    if (!pictureUrl) {
        throw new CustomError('File upload failed', 500);
    }

    try {
        return await executeInTransaction(async (t) => {
            await updateUser(auth0Id, { pictureUrl } as any, t);
            const user = await findById(auth0Id, t);
            if (!user) {
                throw new CustomError('User not found after picture update', 404);
            }
            return { user: UserMapper.toDTO(user, true) };
        }, 'updateProfilePicture');
    } catch (err: any) {
        handleError(err, 'updateProfilePictureHandler');
    }
}

function mimeToAvatarExtension(mimetype?: string): string | null {
    switch (mimetype) {
        case 'image/png':
            return '.png';
        case 'image/jpeg':
            return '.jpg';
        case 'image/gif':
            return '.gif';
        case 'image/webp':
            return '.webp';
        case 'image/svg+xml':
            return '.svg';
        default:
            return null;
    }
}

export async function checkUserNameAvailabilityHandler(payload: ServicePayload<unknown, { userName: string }>): Promise<ServiceResponse<{ available: boolean }>> {
    try {
        const userName = payload.params?.userName;
        if (!userName || userName.trim() === '' || config.username.invalidUsernames.includes(userName.toLowerCase())) {
            throw new CustomError('Invalid username', 400);
        }

        return await executeInTransaction(async (t) => {
            const user = await findByUsername(userName, t);

            return { available: !user };
        });
    } catch (err: any) {
        handleError(err, 'checkUserNameAvailabilityHandler');
    }
}