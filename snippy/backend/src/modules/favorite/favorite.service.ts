import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { PaginationService, PaginationQuery } from "../../common/services/pagination.service";
import { createFavorite, deleteFavorite, findFavoriteSnippetsByUser } from "./favorite.repo";
import { Snippets } from "../../entities/snippet.entity";
import { SnippetMapper } from "../snippet/snippet.mapper";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { SnippetListDTO } from "../snippet/dto/snippet.dto";

//#region Favorite CREATE/DELETE
// Create Favorite Handler
export async function addFavoriteHandler(
    payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<never>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const snippetId = payload.params?.snippetId;
        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        await executeInTransaction(async (t) => {
            return await createFavorite(
                {
                    auth0Id,
                    snippetId
                },
                t
            );
        }, 'addFavorite');

        const favoriteSnippet = await Snippets.findByPk(snippetId);
        if (!favoriteSnippet) {
            throw new CustomError('Snippet not found', 404);
        }

        return {
            message: 'Favorite added successfully',
        };

    } catch (error) {
        return handleError(error, 'addFavorite');
    }
}

// Delete Favorite Handler
export async function removeFavoriteHandler(
    payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const snippetId = payload.params?.snippetId;
        if (!snippetId) {
            throw new CustomError("Snippet ID required", 400);
        }

        await executeInTransaction(async (t) => {
            await deleteFavorite(auth0Id, snippetId, t);
        }, 'removeFavorite');

        return { message: 'Favorite removed successfully' };
    } catch (error) {
        return handleError(error, 'removeFavorite');
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