import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { PaginationService, PaginationQuery } from "../../common/services/pagination.service";
import { createFavorite, deleteFavorite, findFavoriteSnippetsByUser, findFavoriteSnippetByUserAndSnippet } from "./favorite.repo";
import { SnippetMapper } from "../snippet/snippet.mapper";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { SnippetListDTO } from "../snippet/dto/snippet.dto";
import { FavoriteMapper } from "./favorite.mapper";
import { FavoriteStatusDTO, FavoriteToggleDTO } from "./dto/favorite.dto";
import { decrementSnippetFavoriteCount, findBySnippetId, incrementSnippetFavoriteCount } from "../snippet/snippet.repo";

//#region Favorite CREATE/DELETE
// Create Favorite Handler
export async function favoriteHandler(
    payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<FavoriteToggleDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        var isFavorited = false;
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
                throw new CustomError('Snippet not found', 404);
            }

            if (snippet.isPrivate && snippet.auth0Id !== auth0Id) {
                throw new CustomError('Forbidden: cannot favorite a private snippet', 403);
            }

            // find or create favorite
            const existingFavorite = await findFavoriteSnippetByUserAndSnippet(auth0Id, snippetId, t);
            if (existingFavorite) {
                await deleteFavorite(auth0Id, snippetId, t);
                isFavorited = false;
                await decrementSnippetFavoriteCount(snippetId, t);
            } else {
                await createFavorite(
                    {
                        auth0Id,
                        snippetId
                    },
                    t
                );
                isFavorited = true;
                await incrementSnippetFavoriteCount(snippetId, t);
            }

            const updatedSnippet = await findBySnippetId(snippetId, t);
            return FavoriteMapper.toToggleDTO(
                isFavorited,
                updatedSnippet?.favoriteCount ?? snippet.favoriteCount
            );
        });

    } catch (error) {
        return handleError(error, 'favorite');
    }
}
//#endregion

//#region Favorite READ
// Get Favorite Snippets by User Handler
export async function getFavoriteSnippetsByUserHandler(
    payload: ServicePayload<unknown, unknown, PaginationQuery & { q?: string }>
): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const q = payload.query?.q;

        return await executeInTransaction(async (t) => {
            const result = await findFavoriteSnippetsByUser(auth0Id, offset, limit, t, q);
            return {
                snippets: SnippetMapper.toListDTOs(
                    result.rows,
                    auth0Id,
                    new Set(result.rows.map((r) => r.snippetId))
                ),
                totalCount: result.count
            };
        });
    } catch (error) {
        return handleError(error, 'getFavoriteSnippetsByUser');
    }
}

// Check if snippet is favorited by current user
export async function isFavoriteHandler(
    payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<FavoriteStatusDTO>> {
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
            const existing = await findFavoriteSnippetByUserAndSnippet(auth0Id, snippetId, t);
            return FavoriteMapper.toStatusDTO(!!existing);
        });
    } catch (error) {
        return handleError(error, 'isFavorite');
    }
}
