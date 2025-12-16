import { sequelize } from "../../database/sequelize";
import { CustomError } from "../../common/exceptions/custom-error";
import { UserMapper } from "./user.mapper";
import { UserDTO, EnsureUserRequest, UpdateUserRequest } from "./dto/user.dto";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { createUser, deleteUser, findById, findByUsername, haveUsers, updateUser } from "./user.repo";
import { handleError } from "../../common/utilities/error-handler";
import { AuthorizationService } from "../../common/services/authorization.service";
import { config } from "../../config";

export async function ensureUserHandler(payload: ServicePayload<EnsureUserRequest>): Promise<ServiceResponse<UserDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
        throw new CustomError("Authentication required", 401);
    }

    let created = false;

    try {
        return await sequelize.transaction(async (t) => {
            let user = await findById(auth0Id, t);

            // Check if the user exists
            if (user) {
                AuthorizationService.verifyOwnership(auth0Id, user.auth0Id, 'user'); // just to confirm ownership

                // incoming values from Auth0 profile (you already extract these)
                const pictureUrl = payload?.body?.pictureUrl;

                // Build a patch only for allowed fields
                const patch: any = {};

                // Update picture_url if different and not empty this usually updates from Auth0 profile only as no bucket for images yet
                if (pictureUrl && pictureUrl !== user.pictureUrl) {
                    // Optionally check last_synced_at or last_modified_by to avoid clobbering manual changes
                    patch.pictureUrl = pictureUrl;
                }

                if (Object.keys(patch).length) {
                    // call your update routine that sanitizes the result
                    const updated = await updateUser(auth0Id, patch, t);

                    if (!updated) {
                        throw new CustomError('Failed to update user', 500);
                    }
                }
            }
            else {
                // Check if any users exist to set isAdmin flag to true for the first user
                const usersExist = await haveUsers(t);
                
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
                    isAdmin: usersExist ? false : true
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
        });
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
        delete (patch as any).auth0Id;
        delete (patch as any).isAdmin;
    }

    if (!patch) {
        throw new CustomError('No update data provided', 400);
    }

    try {
        return await sequelize.transaction(async (t) => {
            const updated = await updateUser(auth0Id, patch as any, t);
            if (!updated) {
                throw new CustomError('User not found', 404);
            }

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

        return await sequelize.transaction(async (t) => {
            const user = await findById(auth0Id, t);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

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

        if (!userName) {
            throw new CustomError("Username required", 400);
        }

        return await sequelize.transaction(async (t) => {
            const user = await findByUsername(userName, t);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            if (user.isPrivate) {
                throw new CustomError('User profile is private', 403);
            }

            return { user: UserMapper.toDTO(user) };
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

        return await sequelize.transaction(async (t) => {
            const user = await findById(auth0Id, t);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            return { user: UserMapper.toDTO(user, true) };
        });
    } catch (err: any) {
        handleError(err, 'getCurrentUserHandler');
    }
}

export async function checkUserNameAvailabilityHandler(payload: ServicePayload<unknown, { userName: string }>): Promise<ServiceResponse<{ available: boolean }>> {
    try {
        const userName = payload.params?.userName;
        if (!userName || userName.trim() === '' || config.username.invalidUsernames.includes(userName.toLowerCase())) {
            throw new CustomError('Invalid username', 400);
        }

        return await sequelize.transaction(async (t) => {
            const user = await findByUsername(userName, t);

            return { available: !user };
        });
    } catch (err: any) {
        handleError(err, 'checkUserNameAvailabilityHandler');
    }
}