import { Users } from "../../models/user.model";
import { CustomError } from "../../utils/custom-error";
import logger from '../../utils/logger';
import { fileTypes, handleSequelizeError, invalidUsernames } from "../../utils/helper";
import { createUser, findById, findByUsername, haveUsers, updateUser } from "./user.repo";
import { Snippets } from "../../models/snippet.model";
import { SnippetFiles } from "../../models/snippetFile.model";
import { Comments } from "../../models/comment.model";
import { Favorites } from "../../models/favorite.model";

//Exported functions
export async function ensureUserHandler(payload: any) {
    const auth0Id = payload.auth?.payload?.sub;

    if (!auth0Id) {
        throw new CustomError('Unauthorized', 401);
    }

    try {
        var user: any = await findById(auth0Id);

        // If user already exists, return the existing user (possibly after patch)
        if (user) {
            // incoming values from Auth0 profile (you already extract these)
            const pictureUrl = payload?.body?.pictureUrl;

            // Build a patch only for allowed fields
            const patch: any = {};

            // Update picture_url if different and not empty
            if (pictureUrl && pictureUrl !== user.pictureUrl) {
                // Optionally check last_synced_at or last_modified_by to avoid clobbering manual changes
                patch.pictureUrl = pictureUrl;
            }

            if (Object.keys(patch).length) {
                // call your update routine that sanitizes the result
                const updated = await updateUser(auth0Id, patch);
                // return sanitized user object to caller
                return { user: updated, created: false };
            }

            // Dummy calls to ensure Models all work together
            await testModels(auth0Id);

            // nothing to change
            return { user, created: false };
        }

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
        
        
        // Dummy calls to ensure Models all work together
        await testModels(auth0Id);


        return { user: createdUser, created: true };
    } catch (err: any) {
        // Preserve already-mapped errors
        if (err instanceof CustomError) throw err;

        // Log original error at debug so we can inspect stack in logs
        logger.debug(`ensureUserHandler error: ${err?.stack || err}`);
        // Map known Sequelize/DB error names to HTTP codes
        handleSequelizeError(err);
    }
}

export async function updateUserHandler(payload: any) {

    const auth0Id = payload.auth?.payload?.sub;

    if (!auth0Id) {
        throw new CustomError('Unauthorized', 401);
    }

    // Prevent updating sensitive fields from this endpoint
    var patch = { ...payload.body } as any;
    delete patch.auth0Id;
    delete patch.isAdmin;

    try {
        var user: any = await updateUser(auth0Id, patch);
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        return { user };
    } catch (err: any) {
        // Preserve already-mapped errors
        if (err instanceof CustomError) throw err;

        logger.debug(`updateUserHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

export async function checkUserNameAvailabilityHandler(userName: string) {
    try {
        console.log(userName);
        if (!userName || userName.trim() === '' || invalidUsernames.includes(userName.toLowerCase())) {
            throw new CustomError('Invalid username', 400);
        }

        const user = await findByUsername(userName);

        return { available: !user };
    } catch (err: any) {
        logger.debug(`checkUserNameAvailability error: ${err?.stack || err}`);
        // Preserve already-mapped errors
        if (err instanceof CustomError) throw err;

        handleSequelizeError(err);
    }
}



// Dummy calls to ensure Models all work together
// TESTIONG PURPOSES ONLY
async function testModels(auth0Id: string) {
    // Dummy calls to ensure Models all work together
    var test = await Snippets.create({
        auth0Id: auth0Id,
        name: 'Test2',
        shortId: ''
    } as any); // Dummy call to ensure Snippets model is imported

    await SnippetFiles.create({
        snippetId: test.snippetId,
        fileType: fileTypes.html.toString(),
        content: '<p>This is a test file.</p>'
    } as any); // Dummy call to ensure Snippet_Files model is imported

    await SnippetFiles.create({
        snippetId: test.snippetId,
        fileType: fileTypes.css.toString(),
        content: '.class { color: red; }'
    } as any); // Dummy call to ensure Snippet_Files model is imported

    await SnippetFiles.create({
        snippetId: test.snippetId,
        fileType: fileTypes.js.toString(),
        content: 'console.log("Hello, world!");'
    } as any); // Dummy call to ensure Snippet_Files model is imported

    var snippet = await Snippets.findOne({ where: { shortId: test.shortId }});

    await Comments.create({
        snippetId: snippet?.snippetId,
        auth0Id: auth0Id,
        content: 'This is a test comment.'
    } as any); // Dummy call to ensure Comments model is imported

    await snippet?.increment('commentCount');

    await Favorites.create({
        auth0Id: auth0Id,
        snippetId: snippet?.snippetId
    } as any); // Dummy call to ensure Favorites model is imported

    await snippet?.increment('favoriteCount');
}