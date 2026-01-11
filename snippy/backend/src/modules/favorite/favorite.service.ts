import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { PaginationService, PaginationQuery } from "../../common/services/pagination.service";
import { createFavorite, deleteFavorite, findFavoriteSnippetsByUser, findFavoriteSnippetByUserAndSnippet } from "./favorite.repo";
import { Snippets } from "../../entities/snippet.entity";
import { SnippetMapper } from "../snippet/snippet.mapper";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { SnippetListDTO } from "../snippet/dto/snippet.dto";
import { decrementSnippetFavoriteCount, findBySnippetId, incrementSnippetFavoriteCount } from "../snippet/snippet.repo";

//#region Favorite CREATE/DELETE
// Create Favorite Handler
export async function favoriteHandler(
    payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<never>> {
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
            //find or create favorite
            const existingFavorite = await findFavoriteSnippetByUserAndSnippet(auth0Id, snippetId, t);
            if (existingFavorite) {
                //delete existing favorite to avoid duplicates
                await deleteFavorite(auth0Id, snippetId, t);
                isFavorited = false;
                await decrementSnippetFavoriteCount(snippetId, t);
            }
            else {
                //create new favorite
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

            const snippet = await findBySnippetId(snippetId, t);
            if (!snippet) {
                throw new CustomError('Snippet not found', 404);
            }
            return {
                isFavorited, favoriteCount: snippet.favoriteCount
            };
        });

    } catch (error) {
        return handleError(error, 'favorite');
    }
}
//#endregion

//#region Favorite READ
// Get Favorite Snippets by User Handler
export async function getFavoriteSnippetsByUserHandler(
    payload: ServicePayload<unknown, unknown, PaginationQuery>
): Promise<ServiceResponse<SnippetListDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const result = await findFavoriteSnippetsByUser(auth0Id, offset, limit, t);
            return {
                snippets: SnippetMapper.toListDTOs(result.rows, auth0Id),
                totalCount: result.count
            };
        });
    } catch (error) {
        return handleError(error, 'getFavoriteSnippetsByUser');
    }
}