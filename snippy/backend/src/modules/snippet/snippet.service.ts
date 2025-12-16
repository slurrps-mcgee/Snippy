import { sequelize } from "../../database/sequelize";
import { Snippets } from "../../entities/snippet.entity";
import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error-handler";
import { AuthorizationService } from "../../common/services/authorization.service";
import { PaginationService } from "../../common/services/pagination.service";
import { SnippetMapper } from "./snippet.mapper";
import { SnippetDTO, SnippetListDTO } from "./dto/snippet.dto";
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

// Create Snippet
export async function createSnippetHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        return await sequelize.transaction(async (t) => {
            let newSnippet = await createSnippet({
                auth0Id,
                ...payload.body,
                shortId: ''
            }, t);

            for (const file of payload.body?.snippetFiles || []) {
                file.snippetId = newSnippet.snippetId;
            }

            await createSnippetFiles(payload.body?.snippetFiles || [], t);

            newSnippet = await findByShortId(newSnippet.shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(newSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'createSnippetHandler');
    }
}

// Fork Snippet
export async function forkSnippetHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const originalShortId = payload.body?.shortId;

        return await sequelize.transaction(async (t) => {
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
export async function updateSnippetHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const shortId = payload.params?.shortId;
        const patch = payload.body;

        // Prevent updating system fields
        delete patch.snippetId;
        delete patch.auth0Id;
        delete patch.shortId;
        delete patch.parentShortId;

        return await sequelize.transaction(async (t) => {
            let snippet = await findByShortId(shortId, t);
            
            if (!snippet) {
                throw new CustomError("Snippet not found", 404);
            }

            AuthorizationService.verifyOwnership(snippet.auth0Id, auth0Id, 'snippet');

            await updateSnippet(shortId, patch, t);

            // Update snippet files - match by index or create mapping
            const existingFiles = snippet.snippetFiles || [];
            const patchFiles = payload.body?.snippetFiles || [];

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

            snippet = await findByShortId(shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(snippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetHandler');
    }
}

// Update Snippet View Count
export async function updateSnippetViewCountHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params?.shortId;

        return await sequelize.transaction(async (t) => {
            await incrementSnippetViewCount(shortId, t);

            const updatedSnippet = await findByShortId(shortId, t) as Snippets;

            return { snippet: SnippetMapper.toDTO(updatedSnippet, auth0Id) };
        });
    } catch (err: any) {
        handleError(err, 'updateSnippetViewCountHandler');
    }
}

// Delete Snippet
export async function deleteSnippetHandler(payload: ServicePayload): Promise<ServiceResponse<never>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const shortId = payload.params?.shortId;

        return await sequelize.transaction(async (t) => {
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
export async function getSnippetHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetDTO>> {
    const auth0Id = payload.auth?.payload?.sub;
    const shortId = payload.params?.shortId;

    try {
        return await sequelize.transaction(async (t) => {
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
export async function getAllPublicSnippetsHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query);

        return await sequelize.transaction(async (t) => {
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
export async function getUserPublicSnippetsHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        const { offset, limit } = PaginationService.getPaginationParams(payload.query);

        return await sequelize.transaction(async (t) => {
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
export async function getMySnippetsHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query);

        return await sequelize.transaction(async (t) => {
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
export async function searchSnippetsHandler(payload: ServicePayload): Promise<ServiceResponse<SnippetListDTO>> {
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
        
        const { offset, limit } = PaginationService.getPaginationParams(payload.query);

        return await sequelize.transaction(async (t) => {
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