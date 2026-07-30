import { Snippets } from "../../entities/snippet.entity";
import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { AuthorizationService } from "../../common/services/authorization.service";
import { PaginationService, PaginationQuery } from "../../common/services/pagination.service";
import { SnippetMapper } from "./snippet.mapper";
import { SnippetDTO, SnippetListDTO, CreateSnippetRequest, UpdateSnippetRequest } from "./dto/snippet.dto";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { findByUsername } from "../user/user.repo";
import { config } from "../../config";
import { findFavoritedSnippetIds } from "../favorite/favorite.repo";
import {
    createSnippet,
    createSnippetFiles,
    decrementSnippetForkCount,
    deleteSnippet,
    getAllPublicSnippets,
    findBySnippetId,
    incrementSnippetForkCount,
    updateSnippet,
    updateSnippetFiles,
    incrementSnippetViewCount,
    getMySnippets,
    getUserPublicSnippets,
    searchSnippets,
    findByShortId,
    getFeedSnippets,
} from "./snippet.repo";
import { findSnippetView, upsertSnippetView } from "./snippetView.repo";
import { SnippetListQuery } from "./dto/snippet.dto";
import { Transaction } from "sequelize";
import { findFollowingIds } from "../follow/follow.repo";

async function mapSnippetsWithFavorites(
    rows: Snippets[],
    auth0Id: string | undefined,
    transaction?: Transaction,
    allFavorited = false
) {
    const followingAuth0Ids = auth0Id
        ? new Set(await findFollowingIds(auth0Id, transaction))
        : undefined;

    if (allFavorited && auth0Id) {
        return SnippetMapper.toListDTOs(
            rows,
            auth0Id,
            new Set(rows.map((r) => r.snippetId)),
            followingAuth0Ids
        );
    }
    const favoritedIds = auth0Id
        ? await findFavoritedSnippetIds(auth0Id, rows.map((r) => r.snippetId), transaction)
        : new Set<string>();
    return SnippetMapper.toListDTOs(rows, auth0Id, favoritedIds, followingAuth0Ids);
}/**
 * Protected fields that cannot be updated through the updateSnippet endpoint
 * These fields are system-managed and should not be modified by users
 */
const PROTECTED_SNIPPET_FIELDS = ['snippetId', 'auth0Id', 'shortId', 'parentShortId'] as const;

//#region CREATE/UPDATE/DELETE
// Create Snippet
export async function createSnippetHandler(payload: ServicePayload<CreateSnippetRequest>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        return await executeInTransaction(async (t) => {
            const { snippetFiles, ...snippetData } = payload.body || {};

            let newSnippet = await createSnippet({
                auth0Id,
                ...snippetData,
                shortId: ''
            }, t);

            if (snippetFiles && snippetFiles.length > 0) {
                const filesWithSnippetId = snippetFiles.map(file => ({
                    ...file,
                    snippetId: newSnippet.snippetId
                }));
                await createSnippetFiles(filesWithSnippetId as any, t);
            }

            newSnippet = await findBySnippetId(newSnippet.snippetId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(newSnippet, auth0Id) };
        }, 'createSnippet');
    } catch (err: any) {
        handleError(err, 'createSnippetHandler');
    }
}

// Fork Snippet
export async function forkSnippetHandler(payload: ServicePayload<unknown, { snippetId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const originalSnippetId = payload.params?.snippetId;
        ;

        if (!originalSnippetId) {
            throw new CustomError("Original snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const originalSnippet = await findBySnippetId(originalSnippetId, t);

            if (!originalSnippet) {
                throw new CustomError("Original snippet not found", 404);
            }

            if (originalSnippet.isPrivate && originalSnippet.auth0Id !== auth0Id) {
                throw new CustomError("Forbidden: cannot fork a private snippet", 403);
            }

            const forkData = {
                auth0Id,
                parentShortId: originalSnippet.shortId,
                name: originalSnippet.name,
                description: originalSnippet.description,
                tags: originalSnippet.tags,
                isPrivate: originalSnippet.isPrivate,
                externalResources: originalSnippet.externalResources ?? [],
                shortId: ''
            };

            let forkedSnippet = await createSnippet(forkData, t);

            if (originalSnippet.snippetFiles && originalSnippet.snippetFiles.length > 0) {
                const forkFiles = originalSnippet.snippetFiles.map((file: any) => ({
                    snippetId: forkedSnippet.snippetId,
                    fileType: file.fileType,
                    content: file.content,
                }));
                await createSnippetFiles(forkFiles, t);
            }

            await incrementSnippetForkCount(originalSnippetId, t);

            forkedSnippet = await findBySnippetId(forkedSnippet.snippetId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(forkedSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'forkSnippetHandler');
    }
}

// Update Snippet
export async function updateSnippetHandler(payload: ServicePayload<UpdateSnippetRequest, { snippetId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const snippetId = payload.params?.snippetId;
        const patch = payload.body;

        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            let snippet = await findBySnippetId(snippetId, t);

            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            // Prevent updating system fields
            if (patch) {
                // Remove protected fields to prevent unauthorized modifications
                PROTECTED_SNIPPET_FIELDS.forEach(field => {
                    delete (patch as any)[field];
                });
            }

            AuthorizationService.verifyOwnership(snippet.auth0Id, auth0Id, 'snippet');

            if (!patch) {
                throw new CustomError('No update data provided', 400);
            }

            await updateSnippet(snippetId, patch as any, t);


            // Create or update snippet files (await all updates before fetching snippet)
            const patchFiles = payload.body?.snippetFiles || [];
            await Promise.all(patchFiles.map(async snippetFile => {
                if (!snippetFile.snippetFileID) {
                    const newFile = {
                        ...snippetFile,
                        snippetId: snippet?.snippetId
                    };
                    await createSnippetFiles([newFile as any], t);
                } else {
                    await updateSnippetFiles(snippetFile.snippetFileID, snippetFile as any, t);
                }
            }));

            snippet = await findBySnippetId(snippetId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(snippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetHandler');
    }
}

// Update Snippet View Count
export async function updateSnippetViewCountHandler(payload: ServicePayload<unknown, { snippetId: string }>): Promise<ServiceResponse<never>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const snippetId = payload.params?.snippetId;
        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const snippet = await findBySnippetId(snippetId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            if (snippet.isPrivate && snippet.auth0Id !== auth0Id) {
                throw new CustomError("Forbidden: private snippet", 403);
            }

            // Owners do not inflate their own view counts
            if (snippet.auth0Id === auth0Id) {
                return { viewCount: snippet.viewCount, counted: false };
            }

            const existingView = await findSnippetView(snippetId, auth0Id, t);
            const now = new Date();
            if (
                existingView &&
                now.getTime() - new Date(existingView.lastViewedAt).getTime() < config.views.cooldownMs
            ) {
                return { viewCount: snippet.viewCount, counted: false };
            }

            await upsertSnippetView(snippetId, auth0Id, now, t);
            await incrementSnippetViewCount(snippetId, t);

            const updatedSnippet = await findBySnippetId(snippetId, t) as Snippets;
            return { viewCount: updatedSnippet.viewCount, counted: true };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetViewCountHandler');
    }
}

// Delete Snippet
export async function deleteSnippetHandler(payload: ServicePayload<unknown, { snippetId: string }>): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const snippetId = payload.params?.snippetId;

        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const snippet = await findBySnippetId(snippetId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            AuthorizationService.verifyOwnership(snippet.auth0Id, auth0Id, 'snippet');

            if (snippet.parentShortId) {
                const parent = await findByShortId(snippet.parentShortId, t);
                if (parent) {
                    await decrementSnippetForkCount(parent.snippetId, t);
                }
            }

            await deleteSnippet(snippetId, t);

            return { message: "Snippet deleted successfully" };
        });
    } catch (err: any) {
        handleError(err, 'deleteSnippetHandler');
    }
}
//#endregion

//#region READ
// Get Snippet by ShortId
export async function getSnippetByShortIdHandler(payload: ServicePayload<unknown, { shortId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    const shortId = payload.params?.shortId;

    if (!shortId) {
        throw new CustomError("Short ID required", 400);
    }

    try {
        return await executeInTransaction(async (t) => {
            const snippet = await findByShortId(shortId, t);

            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            if (snippet.auth0Id !== auth0Id && snippet.isPrivate) {
                throw new CustomError("Forbidden: private snippet", 403);
            }

            let isFavorited: boolean | undefined;
            if (auth0Id) {
                const favoritedIds = await findFavoritedSnippetIds(auth0Id, [snippet.snippetId], t);
                isFavorited = favoritedIds.has(snippet.snippetId);
            }

            return { snippet: SnippetMapper.toDTO(snippet, auth0Id, isFavorited) };
        });
    } catch (err: any) {
        handleError(err, 'getSnippetHandler');
    }
}
// Get All Public Snippets (Pagination)
export async function getAllPublicSnippetsHandler(
    payload: ServicePayload<unknown, unknown, SnippetListQuery>
): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const sort = payload.query?.sort;
        const tag = payload.query?.tag;
        const q = payload.query?.q;

        return await executeInTransaction(async (t) => {
            const result = await getAllPublicSnippets(offset, limit, t, sort, tag, q);
            return {
                snippets: await mapSnippetsWithFavorites(result.rows, auth0Id, t),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getAllPublicSnippetsHandler');
    }
}

// Get Public Snippets by User
export async function getUserPublicSnippetsHandler(payload: ServicePayload<unknown, { userName: string }, PaginationQuery & { q?: string }>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const q = payload.query?.q;

        if (!userName) {
            throw new CustomError("Username required", 400);
        }

        return await executeInTransaction(async (t) => {
            const user = await findByUsername(userName, t);
            if (!user) {
                throw new CustomError("User not found", 404);
            }

            if (user.isPrivate && user.auth0Id !== auth0Id) {
                throw new CustomError("Forbidden: user profile is private", 403);
            }

            const result = await getUserPublicSnippets(user.auth0Id, offset, limit, t, q);
            return {
                snippets: await mapSnippetsWithFavorites(result.rows, auth0Id, t),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getUserPublicSnippetsHandler');
    }
}

// Get Current User's Snippets
export async function getMySnippetsHandler(payload: ServicePayload<unknown, unknown, PaginationQuery & { q?: string }>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const q = payload.query?.q;

        return await executeInTransaction(async (t) => {
            const result = await getMySnippets(auth0Id, offset, limit, t, q);
            return {
                snippets: await mapSnippetsWithFavorites(result.rows, auth0Id, t),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getMySnippetsHandler');
    }
}

// Search Snippets
export async function searchSnippetsHandler(
    payload: ServicePayload<unknown, unknown, SnippetListQuery>
): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        const generalQuery = payload.query?.q || '';
        const nameQuery = payload.query?.name || '';
        const descriptionQuery = payload.query?.description || '';
        const query = generalQuery || nameQuery || descriptionQuery || '';

        if (!query.trim()) {
            return { snippets: [], totalCount: 0 };
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const sort = payload.query?.sort;
        const tag = payload.query?.tag;

        return await executeInTransaction(async (t) => {
            const result = await searchSnippets(query, offset, limit, t, sort, tag);
            return {
                snippets: await mapSnippetsWithFavorites(result.rows, auth0Id, t),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'searchSnippetsHandler');
    }
}

// Feed: public pens from followed users
export async function getFeedSnippetsHandler(
    payload: ServicePayload<unknown, unknown, SnippetListQuery>
): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const sort = payload.query?.sort;
        const q = payload.query?.q;

        return await executeInTransaction(async (t) => {
            const followingIds = await findFollowingIds(auth0Id, t);
            const result = await getFeedSnippets(followingIds, offset, limit, t, sort, q);
            return {
                snippets: await mapSnippetsWithFavorites(result.rows, auth0Id, t),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getFeedSnippetsHandler');
    }
}

/** Build a standalone HTML document for public embed (no JWT). */
export async function getSnippetEmbedHtmlHandler(
    payload: ServicePayload<unknown, { shortId: string }>
): Promise<string> {
    try {
        const shortId = payload.params?.shortId;
        if (!shortId) {
            throw new CustomError("Short ID required", 400);
        }

        const snippet = await findByShortId(shortId);
        if (!snippet || snippet.isPrivate) {
            throw new CustomError("Snippet not found", 404);
        }

        const files = snippet.snippetFiles || [];
        const html = files.find((f) => f.fileType === 'html')?.content ?? '';
        const css = files.find((f) => f.fileType === 'css')?.content ?? '';
        const js = files.find((f) => f.fileType === 'js')?.content ?? '';

        const externalLinks = (snippet.externalResources || [])
            .map((r) => {
                if (r.resourceType === 'css') {
                    return `<link rel="stylesheet" href="${escapeHtmlAttr(r.url)}">`;
                }
                if (r.resourceType === 'js') {
                    return `<script src="${escapeHtmlAttr(r.url)}"></script>`;
                }
                return `<!-- resource: ${escapeHtmlAttr(r.url)} -->`;
            })
            .join('\n');

        const title = escapeHtmlText(snippet.name || 'Snippy Embed');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${externalLinks}
<style>
${css}
</style>
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`;
    } catch (err: any) {
        handleError(err, 'getSnippetEmbedHtmlHandler');
        throw err;
    }
}

function escapeHtmlAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
//#endregion
