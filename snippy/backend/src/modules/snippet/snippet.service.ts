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
    findByShortId,
    incrementSnippetForkCount,
    updateSnippet,
    updateSnippetFiles,
    incrementSnippetViewCount,
    getMySnippets,
    getUserPublicSnippets,
    searchSnippets,
} from "./snippet.repo";

/**
 * Protected fields that cannot be updated through the updateSnippet endpoint
 * These fields are system-managed and should not be modified by users
 */
const PROTECTED_SNIPPET_FIELDS = ['snippetId', 'auth0Id', 'shortId', 'parentShortId'] as const;

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

            newSnippet = await findByShortId(newSnippet.shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(newSnippet, auth0Id) };
        }, 'createSnippet');
    } catch (err: any) {
        handleError(err, 'createSnippetHandler');
    }
}

// Fork Snippet
export async function forkSnippetHandler(payload: ServicePayload<{ shortId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const originalShortId = payload.body?.shortId;

        if (!originalShortId) {
            throw new CustomError("Original snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const originalSnippet = await findByShortId(originalShortId, t);

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

            await incrementSnippetForkCount(originalShortId, t);

            forkedSnippet = await findByShortId(forkedSnippet.shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(forkedSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'forkSnippetHandler');
    }
}

// Update Snippet
export async function updateSnippetHandler(payload: ServicePayload<UpdateSnippetRequest, { shortId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const shortId = payload.params?.shortId;
        const patch = payload.body;

        if (!shortId) {
            throw new CustomError("Snippet ID required", 400);
        }

        // Prevent updating system fields
        if (patch) {
            // Remove protected fields to prevent unauthorized modifications
            PROTECTED_SNIPPET_FIELDS.forEach(field => {
                delete (patch as any)[field];
            });
        }

        return await executeInTransaction(async (t) => {
            let snippet = await findByShortId(shortId, t);
            
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            AuthorizationService.verifyOwnership(snippet.auth0Id, auth0Id, 'snippet');

            if (!patch) {
                throw new CustomError('No update data provided', 400);
            }

            await updateSnippet(shortId, patch as any, t);

            // Update snippet files - match by index or create mapping
            const existingFiles = snippet.snippetFiles || [];
            const patchFiles = payload.body?.snippetFiles || [];

            for (let i = 0; i < patchFiles.length; i++) {
                const filePatch = patchFiles[i];
                
                if (i < existingFiles.length) {
                    // Update existing file using its ID
                    const existingFile = existingFiles[i];
                    await updateSnippetFiles(existingFile.snippetFileID, filePatch as any, t);
                } else {
                    // If more files in patch than exist, create new ones
                    const newFile = {
                        ...filePatch,
                        snippetId: snippet.snippetId
                    };
                    await createSnippetFiles([newFile as any], t);
                }
            }

            snippet = await findByShortId(shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(snippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetHandler');
    }
}

// Update Snippet View Count
export async function updateSnippetViewCountHandler(payload: ServicePayload<unknown, { shortId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params?.shortId;

        if (!shortId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            await incrementSnippetViewCount(shortId, t);

            const updatedSnippet = await findByShortId(shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(updatedSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetViewCountHandler');
    }
}

// Delete Snippet
export async function deleteSnippetHandler(payload: ServicePayload<unknown, { shortId: string }>): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const shortId = payload.params?.shortId;

        if (!shortId) {
            throw new CustomError("Snippet ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const snippet = await findByShortId(shortId, t);
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            AuthorizationService.verifyOwnership(snippet.auth0Id, auth0Id, 'snippet');

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

// Get Snippet by ShortId
export async function getSnippetByShortIdHandler(payload: ServicePayload<unknown, { shortId: string }>): Promise<ServiceResponse<SnippetDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    const shortId = payload.params?.shortId;

    if (!shortId) {
        throw new CustomError("Snippet ID required", 400);
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