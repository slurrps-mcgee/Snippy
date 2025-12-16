import { sequelize } from "../../database/sequelize";
import { Snippets } from "../../entities/snippet.entity";
import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utils/error-handler";
import { findByUsername } from "../user/user.repo";
import {
    createSnippet,
    createSnippetFiles,
    decrementSnippetForkCount,
    deleteSnippet,
    getAllPublicSnippets,
    findByShortId,
    incrementSnippetForkCount,
    updateSnippet,
    updateSnippetFiles,
    incrementSnippetViewCount,
    getMySnippets,
    getUserPublicSnippets,
    searchSnippets,
} from "./snippet.repo";

// #region CREATE
// Create Snippet
export async function createSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        // Use transaction to ensure atomicity
        return await sequelize.transaction(async (t) => {
            // Create the snippet (shortId resilience handled in @BeforeCreate hook)
            var newSnippet = await createSnippet({
                auth0Id,
                ...payload.body,
                shortId: '' // auto-generated with resilience in createUniqueShortName
            }, t);

            // Set snippetId for each snippet file from newSnippet
            for (const file of payload.body.snippetFiles || []) {
                file.snippetId = newSnippet.snippetId;
            }

            // Create snippet files
            await createSnippetFiles(payload.body.snippetFiles || [], t);

            // Query back the new snippet with its files
            newSnippet = await findByShortId(newSnippet.shortId, t) as any;

            return { snippet: sanitizeSnippet(newSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'createSnippetHandler');
    }
}
// Fork Snippet
export async function forkSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const originalShortId = payload.body.shortId;

        return await sequelize.transaction(async (t) => {

            const originalSnippet = await findByShortId(originalShortId, t);

            if (!originalSnippet) {
                throw new CustomError("Original snippet not found", 404);
            }

            if(originalSnippet.isPrivate && originalSnippet.auth0Id !== auth0Id) {
                throw new CustomError("Unauthorized to fork private snippet", 401);
            }

            // Create fork data with only the necessary fields
            const forkData = {
                auth0Id: auth0Id,
                parentShortId: originalSnippet.shortId,
                name: originalSnippet.name,
                description: originalSnippet.description,
                tags: originalSnippet.tags,
                isPrivate: originalSnippet.isPrivate,
                shortId: '' // auto-generated with resilience in createUniqueShortName
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

            return { snippet: sanitizeSnippet(forkedSnippet, auth0Id) };
        });

    } catch (err: any) {
        handleError(err, 'forkSnippetHandler');
    }
}
// #endregion

// #region UPDATE
export async function updateSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params.shortId;
        const patch = payload.body;

        // Prevent updating system fields
        delete patch.snippetId;
        delete patch.auth0Id;
        delete patch.shortId;
        delete patch.parentShortId;

        return await sequelize.transaction(async (t) => {
            var snippet = await findByShortId(shortId, t);
            
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            const ownsSnippet = snippet.auth0Id === auth0Id;
            if (!ownsSnippet) {
                throw new CustomError("Unauthorized: not snippet owner", 401);
            }

            await updateSnippet(shortId, patch, t);

            // Update snippet files - match by index or create mapping
            const existingFiles = snippet.snippetFiles || [];
            const patchFiles = payload.body.snippetFiles || [];

            for (let i = 0; i < patchFiles.length; i++) {
                const filePatch = patchFiles[i];
                
                if (i < existingFiles.length) {
                    // Update existing file using its ID
                    const existingFile = existingFiles[i];
                    await updateSnippetFiles(existingFile.snippetFileID, filePatch, t);
                } else {
                    // If more files in patch than exist, create new ones
                    const newFile = {
                        ...filePatch,
                        snippetId: snippet.snippetId
                    };
                    await createSnippetFiles([newFile], t);
                }
            }

            snippet = await findByShortId(shortId, t);

            return { snippet: sanitizeSnippet(snippet!, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetHandler');
    }
}
// Update Snippet View Count
export async function updateSnippetViewCountHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params.shortId;

        return await sequelize.transaction(async (t) => {
            await incrementSnippetViewCount(shortId, t);

            const updatedSnippet = await findByShortId(shortId, t);

            return { snippet: sanitizeSnippet(updatedSnippet!, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetViewCountHandler');
    }
}
// #endregion

// #region DELETE
export async function deleteSnippetHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params.shortId;

        return await sequelize.transaction(async (t) => {
            const snippet = await findByShortId(shortId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            const ownsSnippet = snippet.auth0Id === auth0Id;
            if (!ownsSnippet) {
                throw new CustomError("Unauthorized: not snippet owner", 401);
            }

            if (snippet.parentShortId) {
                await decrementSnippetForkCount(snippet.parentShortId, t);
            }

            await deleteSnippet(shortId, t);

            return { message: "Snippet deleted successfully" };
        });
    } catch (err: any) {
        handleError(err, 'deleteSnippetHandler');
    }
}

// #endregion

// #region READ Handlers
// Get Snippet by ShortId
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

        return { snippet: sanitizeSnippet(snippet, auth0Id) };
    } catch (err: any) {
        handleError(err, 'getSnippetHandler');
    }
}
// Get All Public Snippets (Pagination)
export async function getAllPublicSnippetsHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await getAllPublicSnippets(offset, limit);
        return { snippets: result.rows.map(s => sanitizeSnippetList(s, auth0Id)), totalCount: result.count };
    } catch (err: any) {
        handleError(err, 'getAllPublicSnippetsHandler');
    }
}
// Get Public Snippets by User
export async function getUserPublicSnippetsHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params.userName;
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await findByUsername(userName);
        if (!user) {
            throw new CustomError("User not found", 404);
        }

        const result = await getUserPublicSnippets(user.auth0Id, offset, limit);
        return { snippets: result.rows.map(s => sanitizeSnippetList(s, auth0Id)), totalCount: result.count };
    } catch (err: any) {
        handleError(err, 'getUserPublicSnippetsHandler');
    }
}
// Get Current User's Snippets
export async function getMySnippetsHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await getMySnippets(auth0Id, offset, limit);
        return { snippets: result.rows.map(s => sanitizeSnippetList(s, auth0Id)), totalCount: result.count };
    } catch (err: any) {
        handleError(err, 'getMySnippetsHandler');
    }
}
// Search Snippets
export async function searchSnippetsHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        // Handle multiple search parameter formats:
        // ?q=searchterm (general search)
        // ?name=searchterm (search by name)
        // ?description=searchterm (search by description)
        const generalQuery = payload.query.q || '';
        const nameQuery = payload.query.name || '';
        const descriptionQuery = payload.query.description || '';
        
        // Combine all search terms into a single query string
        const query = generalQuery || nameQuery || descriptionQuery || '';
        
        if (!query.trim()) {
            return { snippets: [] };
        }
        
        const page = parseInt(payload.query.page) || 1;
        const limit = parseInt(payload.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await searchSnippets(query, offset, limit);
        return { snippets: result.rows.map(s => sanitizeSnippetList(s, auth0Id)), totalCount: result.count };
    } catch (err: any) {
        handleError(err, 'searchSnippetsHandler');
    }
}
// #endregion

// Sanitize Snippet before returning to client
function sanitizeSnippet(snippet: Snippets, currentUser: string): any {
    return {
        shortId: snippet.shortId,
        name: snippet.name,
        description: snippet.description,
        tags: snippet.tags,
        isPrivate: snippet.isPrivate,
        forkCount: snippet.forkCount,
        viewCount: snippet.viewCount,
        commentCount: snippet.commentCount,
        favoriteCount: snippet.favoriteCount,
        parentShortId: snippet.parentShortId,
        isOwner: snippet.auth0Id === currentUser,
        displayName: (snippet as any).user?.displayName,
        snippetFiles: snippet.snippetFiles?.map(file => ({
            fileType: file.fileType,
            content: file.content
        })),
    }
}

function sanitizeSnippetList(snippet: Snippets, currentUser: string): any {
    return {
        shortId: snippet.shortId,
        name: snippet.name,
        description: snippet.description,
        tags: snippet.tags,
        userName: (snippet as any).user?.userName,
        commentCount: snippet.commentCount,
        favoriteCount: snippet.favoriteCount,
        viewCount: snippet.viewCount,
        isOwner: snippet.auth0Id === currentUser
    }
}