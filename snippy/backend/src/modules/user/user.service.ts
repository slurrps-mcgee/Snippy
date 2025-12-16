import { Users } from "../../entities/user.entity";
import { CustomError } from "../../common/exceptions/custom-error";
import { invalidUsernames } from "../../common/utils/helper";
import { createUser, deleteUser, findById, findByUsername, haveUsers, updateUser } from "./user.repo";
import { handleError } from "../../common/utils/error-handler";

export async function ensureUserHandler(payload: any) {
    const auth0Id = payload.auth?.payload?.sub;
    var created = false;

    try {
        var user = await findById(auth0Id);

        // Check if the user exists
        if (user) {
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
                const updated = await updateUser(auth0Id, patch);

                if (!updated) {
                    throw new CustomError('Failed to update user', 500);
                }
            }
        }
        else {
            // Check if any users exist to set isAdmin flag to true for the first user
            const usersExist = await haveUsers();
            
            const details = {
                name: payload?.body?.name,
                pictureUrl: payload?.body?.pictureUrl
            }

            const createdUser: Users = await createUser({
                auth0Id: auth0Id,
                userName: details.name || '',
                displayName: details.name,
                bio: null,
                pictureUrl: details.pictureUrl,
                isAdmin: usersExist ? false : true
            } as any);

            if (!createdUser) throw new CustomError('Failed to create user', 500);

            created = true;
        }


        //testModels(auth0Id); // Remove after testing
        //testModels(auth0Id); // Remove after testing

        // Fetch the user again to return
        user = await findById(auth0Id);

        if (!user) {
            throw new CustomError('User not found after ensure', 500);
        }

        // Sanitize user before returning
        user = sanitizeUser(user!);
        // Return user and created flag
        return { user, created };
    } catch (err: any) {
        handleError(err, 'ensureUserHandler');
    }
}

export async function updateUserHandler(payload: any) {

    const auth0Id = payload.auth?.payload?.sub;

    // Prevent updating sensitive fields from this endpoint
    var patch = { ...payload.body } as any;
    delete patch.auth0Id;
    delete patch.isAdmin;

    try {
        var updated: any = await updateUser(auth0Id, patch);
        if (!updated) {
            throw new CustomError('User not found', 404);
        }

        // Get complete user data then sanitize for frontend response
        var user = await findById(auth0Id);

        if (!user) {
            throw new CustomError('User not found after update', 404);
        }

        user = sanitizeUser(user);

        return { user };
    } catch (err: any) {
        handleError(err, 'updateUserHandler');
    }
}

export async function deleteUserHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        if (!auth0Id) {
            throw new CustomError('Unauthorized', 401);
        }

        const user = await findById(auth0Id);

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        await deleteUser(auth0Id);

        return { message: 'User deleted successfully' };
    } catch (err: any) {
        handleError(err, 'deleteUserHandler');
    }
}

export async function getUserProfileHandler(payload: any) {
    try {
        const userName = payload.params.userName;

        // Get user data (already sanitized by findByUsername)
        var user = await findByUsername(userName);

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        if (user.isPrivate) {
            throw new CustomError('User profile is private', 403);
        }

        user = sanitizeUser(user);

        return { user };
    } catch (err: any) {
        handleError(err, 'getUserProfileHandler');
    }
}

export async function getCurrentUserHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        if (!auth0Id) {
            throw new CustomError('Unauthorized', 401);
        }

        var user = await findById(auth0Id);

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        user = sanitizeUser(user);

        return { user };
    } catch (err: any) {
        handleError(err, 'getCurrentUserHandler');
    }
}

export async function checkUserNameAvailabilityHandler(payload: any) {
    try {
        const userName = payload.params.userName;
        if (!userName || userName.trim() === '' || invalidUsernames.includes(userName.toLowerCase())) {
            throw new CustomError('Invalid username', 400);
        }

        const user = await findByUsername(userName);

        return { available: !user };
    } catch (err: any) {
        handleError(err, 'checkUserNameAvailabilityHandler');
    }
}

// Sanitize User before returning to client
function sanitizeUser(user: Users): any {
    return {
        userName: user.userName,
        displayName: user.displayName,
        bio: user.bio,
        pictureUrl: user.pictureUrl
    };
}