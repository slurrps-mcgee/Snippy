import { sequelize } from "../../config/sequelize";
import { CustomError } from "../../utils/custom-error";
import { handleSequelizeError } from "../../utils/helper";
import logger from "../../utils/logger";
import {
    createSnippet,
    createSnippetFiles,
    decrementSnippetForkCount,
    deleteSnippet,
    findAllPublicSnippets,
    findByShortId,
    findByPK,
    incrementSnippetForkCount,
    updateSnippet,
    validateOwnership,
    updateSnippetFiles,
    findAllUserSnippets,
} from "./snippet.repo";

// #region Create
export async function createSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        // Use transaction to ensure atomicity
        return await sequelize.transaction(async (t) => {
            // Create the snippet
            var newSnippet = await createSnippet({
                auth0Id,
                ...payload.body,
                shortId: '' // auto-generated
            }, t);

            // Set snippetId for each snippet file from newSnippet
            for (const file of payload.body.snippetFiles || []) {
                file.snippetId = newSnippet.snippetId;
            }

            // Create snippet files
            await createSnippetFiles(payload.body.snippetFiles || [], t);

            // Query back the new snippet with its files
            newSnippet = await findByShortId(newSnippet.shortId, t) as any;

            return { snippet: newSnippet };
        });
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`createSnippetHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}
// #endregion

// #region Update

export async function updateSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.body.shortId;
        const patch = payload.body;

        // Prevent updating system fields
        delete patch.snippetId;
        delete patch.auth0Id;
        delete patch.shortId;
        delete patch.parentSnippetId;

        return await sequelize.transaction(async (t) => {
            var snippet = await findByShortId(shortId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            const ownsSnippet = await validateOwnership(auth0Id, shortId, t);
            if (!ownsSnippet) {
                throw new CustomError("Unauthorized: not snippet owner", 401);
            }

            await updateSnippet(shortId, patch, t);


            console.log(payload.body.snippetFiles);
            for(const filePatch of payload.body.snippetFiles || []) {
                console.log(filePatch);
                await updateSnippetFiles(filePatch.snippetFileID, filePatch, t);
            }

            snippet = await findByShortId(shortId, t);

            return { snippet: snippet };
        });
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`updateSnippetHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Delete

export async function deleteSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params.shortId;

        return await sequelize.transaction(async (t) => {
            const snippet = await findByShortId(shortId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            const ownsSnippet = await validateOwnership(auth0Id, shortId, t);
            if (!ownsSnippet) {
                throw new CustomError("Unauthorized: not snippet owner", 401);
            }

            if (snippet.parentSnippetId) {
                const parentSnippet = await findByPK(snippet.parentSnippetId || '');
                if (parentSnippet) {
                    await decrementSnippetForkCount(parentSnippet.shortId, t);
                }
            }

            await deleteSnippet(shortId, t);

            return { message: "Snippet deleted successfully" };
        });
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`deleteSnippetHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Fork Snippet

export async function forkSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const originalShortId = payload.body.shortId;

        return await sequelize.transaction(async (t) => {

            const originalSnippet = await findByShortId(originalShortId, t);

            if (!originalSnippet) {
                throw new CustomError("Original snippet not found", 404);
            }

            // Create fork data with only the necessary fields
            const forkData = {
                auth0Id: auth0Id,
                parentSnippetId: originalSnippet.snippetId,
                name: originalSnippet.name,
                description: originalSnippet.description,
                tags: originalSnippet.tags,
                isPrivate: originalSnippet.isPrivate,
                shortId: '' // auto-generated
            };

            var forkedSnippet = await createSnippet(forkData as any, t);

            // Create snippet files for the fork, associating them with the new snippet
            if (originalSnippet.snippetFiles && originalSnippet.snippetFiles.length > 0) {
                const forkFiles = originalSnippet.snippetFiles.map((file: any) => ({
                    snippetId: forkedSnippet.snippetId,
                    fileType: file.fileType,
                    content: file.content,
                }));
                await createSnippetFiles(forkFiles, t);
            }

            await incrementSnippetForkCount(originalShortId, t);

            forkedSnippet = await findByShortId(forkedSnippet.shortId, t) as any;

            return { snippet: forkedSnippet };
        });

    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`forkSnippetHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Get All Public Snippets (Pagination)

export async function getAllPublicSnippetsHandler(payload: any) {
    try {
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        const snippets = await findAllPublicSnippets(offset, limit);
        return { snippets };
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`getAllPublicSnippetsHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Get By Short ID

export async function getSnippetHandler(payload: any) {
    const auth0Id = payload.auth?.payload?.sub;
    const shortId = payload.params.shortId;

    try {
        const snippet = await findByShortId(shortId);

        if (!snippet) {
            throw new CustomError("Snippet not found", 404);
        }

        if (snippet?.auth0Id !== auth0Id && snippet?.isPrivate) {
            throw new CustomError("Unauthorized", 401);
        }

        return { snippet };
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`getSnippetByShortIdHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Get All User's Snippets (Pagination)

export async function getAllUserSnippetsHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        console.log(`Fetching snippets for user: ${auth0Id}, page: ${page}, limit: ${limit}`);

        const snippets = await findAllUserSnippets(auth0Id, offset, limit);
        return { snippets };
    } catch (err: any) {
        if (err instanceof CustomError) throw err;

        logger.debug(`getAllUserSnippetsHandler error: ${err?.stack || err}`);
        handleSequelizeError(err);
    }
}

// #endregion

// #region Shared Error Mapper

// #endregion
