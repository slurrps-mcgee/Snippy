import { sequelize } from "../../database/sequelize";
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
    createExternalResource,
    updateExternalResource,
    deleteExternalResource,
    findByShortId,
} from "./snippet.repo";

/**
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
            const { snippetFiles, externalResources, ...snippetData } = payload.body || {};

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

            if (externalResources && externalResources.length > 0) {
                const resourcesWithSnippetId = externalResources.map(resource => ({
                    ...resource,
                    snippetId: newSnippet.snippetId
                }));
                await createExternalResource(resourcesWithSnippetId as any, t);
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
                throw new CustomError("Unauthorized to fork private snippet", 401);
            }

            const forkData = {
                auth0Id,
                parentShortId: originalSnippet.shortId,
                name: originalSnippet.name,
                description: originalSnippet.description,
                tags: originalSnippet.tags,
                isPrivate: originalSnippet.isPrivate,
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

            if (originalSnippet.externalResources && originalSnippet.externalResources.length > 0) {
                const forkResources = originalSnippet.externalResources.map((resource: any) => ({
                    snippetId: forkedSnippet.snippetId,
                    resourceType: resource.resourceType,
                    url: resource.url,
                }));
                await createExternalResource(forkResources, t);
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
            console.log('Fetching snippet for update:', snippetId);

            let snippet = await findBySnippetId(snippetId, t);

            console.log(snippet)

            if (!snippet) {
                console.log('Snippet not found');
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


            // Create, update, or delete external resources
            const patchResources = payload.body?.externalResources || [];
            // Get all current external resources for this snippet
            const currentResources = snippet.externalResources || [];
            const patchResourceIds = patchResources.filter(r => r.externalId).map(r => r.externalId);

            // Delete resources that are not in the patch
            const resourcesToDelete = currentResources.filter((r: any) => !patchResourceIds.includes(r.externalId));
            if (resourcesToDelete.length > 0) {
                // You need a deleteExternalResource function in your repo
                for (const resource of resourcesToDelete) {
                    await deleteExternalResource(resource.externalId, t);
                }
            }

            // Create or update resources
            await Promise.all(patchResources.map(async resource => {
                if (!resource.externalId) {
                    const newResource = {
                        ...resource,
                        snippetId: snippet?.snippetId
                    };
                    await createExternalResource([newResource as any], t);
                } else {
                    // Find the current resource by externalId
                    const current = currentResources.find((r: any) => r.externalId === resource.externalId);
                    if (current && current.url === resource.url && current.resourceType === resource.resourceType) {
                        // Skip update if url and resourceType match
                        return;
                    }
                    // Only update allowed fields, never externalId
                    const { externalId, ...updateFields } = resource;
                    await updateExternalResource(resource.externalId, updateFields as any, t);
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
export async function updateSnippetViewCountHandler(payload: ServicePayload<unknown, { snippetId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const snippetId = payload.params?.snippetId;

        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            await incrementSnippetViewCount(snippetId, t);

            const updatedSnippet = await findBySnippetId(snippetId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(updatedSnippet, auth0Id) };
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
                await decrementSnippetForkCount(snippet.parentShortId, t);
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
                throw new CustomError("Unauthorized", 401);
            }

            return { snippet: SnippetMapper.toDTO(snippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'getSnippetHandler');
    }
}
// Get All Public Snippets (Pagination)
export async function getAllPublicSnippetsHandler(payload: ServicePayload<unknown, unknown, PaginationQuery>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const result = await getAllPublicSnippets(offset, limit, t);
            return {
                snippets: SnippetMapper.toListDTOs(result.rows, auth0Id),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getAllPublicSnippetsHandler');
    }
}

// Get Public Snippets by User
export async function getUserPublicSnippetsHandler(payload: ServicePayload<unknown, { userName: string }, PaginationQuery>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        if (!userName) {
            throw new CustomError("Username required", 400);
        }

        return await executeInTransaction(async (t) => {
            const user = await findByUsername(userName, t);
            if (!user) {
                throw new CustomError("User not found", 404);
            }

            const result = await getUserPublicSnippets(user.auth0Id, offset, limit, t);
            return {
                snippets: SnippetMapper.toListDTOs(result.rows, auth0Id),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getUserPublicSnippetsHandler');
    }
}

// Get Current User's Snippets
export async function getMySnippetsHandler(payload: ServicePayload<unknown, unknown, PaginationQuery>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const result = await getMySnippets(auth0Id, offset, limit, t);
            return {
                snippets: SnippetMapper.toListDTOs(result.rows, auth0Id),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'getMySnippetsHandler');
    }
}

// Search Snippets
export async function searchSnippetsHandler(payload: ServicePayload<unknown, unknown, PaginationQuery & { q?: string; name?: string; description?: string }>): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        // Handle multiple search parameter formats:
        // ?q=searchterm (general search)
        // ?name=searchterm (search by name)
        // ?description=searchterm (search by description)
        const generalQuery = payload.query?.q || '';
        const nameQuery = payload.query?.name || '';
        const descriptionQuery = payload.query?.description || '';

        // Combine all search terms into a single query string
        const query = generalQuery || nameQuery || descriptionQuery || '';

        if (!query.trim()) {
            return { snippets: [] };
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const result = await searchSnippets(query, offset, limit, t);
            return {
                snippets: SnippetMapper.toListDTOs(result.rows, auth0Id),
                totalCount: result.count
            };
        });
    } catch (err: any) {
        handleError(err, 'searchSnippetsHandler');
    }
}
//#endregion
