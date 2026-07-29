import { CustomError } from '../../common/exceptions/custom-error';
import { handleError } from '../../common/utilities/error';
import { executeInTransaction } from '../../common/utilities/transaction';
import { AuthorizationService } from '../../common/services/authorization.service';
import { PaginationService, PaginationQuery } from '../../common/services/pagination.service';
import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { findByUsername } from '../user/user.repo';
import { findBySnippetId } from '../snippet/snippet.repo';
import { SnippetMapper } from '../snippet/snippet.mapper';
import { findFavoritedSnippetIds } from '../favorite/favorite.repo';
import { CollectionMapper } from './collection.mapper';
import {
    CollectionDTO,
    CreateCollectionRequest,
    UpdateCollectionRequest,
    AddCollectionSnippetRequest,
    ReorderCollectionSnippetsRequest,
} from './dto/collection.dto';
import {
    createCollection,
    updateCollection,
    deleteCollection,
    findCollectionById,
    findCollectionByShortId,
    findMyCollections,
    findUserPublicCollections,
    findCollectionSnippetsOrdered,
    countCollectionSnippets,
    findCollectionSnippet,
    getMaxCollectionPosition,
    addCollectionSnippet,
    removeCollectionSnippet,
    setCollectionSnippetPositions,
} from './collection.repo';

const PROTECTED_FIELDS = ['collectionId', 'auth0Id', 'shortId'] as const;

export async function createCollectionHandler(
    payload: ServicePayload<CreateCollectionRequest>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        return await executeInTransaction(async (t) => {
            const created = await createCollection({
                auth0Id,
                name: payload.body!.name,
                description: payload.body?.description ?? null,
                isPrivate: payload.body?.isPrivate ?? false,
                shortId: '',
            }, t);

            const collection = await findCollectionById(created.collectionId, t);
            return { collection: CollectionMapper.toDTO(collection!, auth0Id, { snippetCount: 0 }) };
        });
    } catch (err) {
        handleError(err, 'createCollectionHandler');
    }
}

export async function updateCollectionHandler(
    payload: ServicePayload<UpdateCollectionRequest, { collectionId: string }>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const collectionId = payload.params?.collectionId;
        if (!collectionId) throw new CustomError('Collection ID required', 400);

        const patch = payload.body;
        if (patch) {
            PROTECTED_FIELDS.forEach((f) => delete (patch as any)[f]);
        }
        if (!patch || !Object.keys(patch).length) {
            throw new CustomError('No update data provided', 400);
        }

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionById(collectionId, t);
            if (!collection) throw new CustomError('Collection not found', 404);
            AuthorizationService.verifyOwnership(collection.auth0Id, auth0Id, 'collection');

            await updateCollection(collectionId, patch as any, t);
            const updated = await findCollectionById(collectionId, t);
            const snippetCount = await countCollectionSnippets(collectionId, t);
            return { collection: CollectionMapper.toDTO(updated!, auth0Id, { snippetCount }) };
        });
    } catch (err) {
        handleError(err, 'updateCollectionHandler');
    }
}

export async function deleteCollectionHandler(
    payload: ServicePayload<unknown, { collectionId: string }>
): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const collectionId = payload.params?.collectionId;
        if (!collectionId) throw new CustomError('Collection ID required', 400);

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionById(collectionId, t);
            if (!collection) throw new CustomError('Collection not found', 404);
            AuthorizationService.verifyOwnership(collection.auth0Id, auth0Id, 'collection');
            await deleteCollection(collectionId, t);
            return { message: 'Collection deleted successfully' };
        });
    } catch (err) {
        handleError(err, 'deleteCollectionHandler');
    }
}

export async function getMyCollectionsHandler(
    payload: ServicePayload<unknown, unknown, PaginationQuery>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const result = await findMyCollections(auth0Id, offset, limit, t);
            return {
                collections: CollectionMapper.toDTOs(result.rows, auth0Id),
                totalCount: result.count,
            };
        });
    } catch (err) {
        handleError(err, 'getMyCollectionsHandler');
    }
}

export async function getUserCollectionsHandler(
    payload: ServicePayload<unknown, { userName: string }, PaginationQuery>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const userName = payload.params?.userName;
        if (!userName) throw new CustomError('Username required', 400);

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

        return await executeInTransaction(async (t) => {
            const user = await findByUsername(userName, t);
            if (!user) throw new CustomError('User not found', 404);

            if (user.isPrivate && user.auth0Id !== auth0Id) {
                throw new CustomError('Forbidden: user profile is private', 403);
            }

            const result = user.auth0Id === auth0Id
                ? await findMyCollections(user.auth0Id, offset, limit, t)
                : await findUserPublicCollections(user.auth0Id, offset, limit, t);

            return {
                collections: CollectionMapper.toDTOs(result.rows, auth0Id),
                totalCount: result.count,
            };
        });
    } catch (err) {
        handleError(err, 'getUserCollectionsHandler');
    }
}

export async function getCollectionByShortIdHandler(
    payload: ServicePayload<unknown, { shortId: string }>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const shortId = payload.params?.shortId;
        if (!shortId) throw new CustomError('Short ID required', 400);

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionByShortId(shortId, t);
            if (!collection) throw new CustomError('Collection not found', 404);

            if (collection.isPrivate && collection.auth0Id !== auth0Id) {
                throw new CustomError('Forbidden: private collection', 403);
            }

            const memberships = await findCollectionSnippetsOrdered(collection.collectionId, t);
            const snippets = memberships
                .map((m) => m.snippet)
                .filter((s): s is NonNullable<typeof s> => !!s)
                .filter((s) => !s.isPrivate || s.auth0Id === auth0Id || collection.auth0Id === auth0Id);

            const favoritedIds = auth0Id
                ? await findFavoritedSnippetIds(auth0Id, snippets.map((s) => s.snippetId), t)
                : new Set<string>();

            return {
                collection: CollectionMapper.toDTO(collection, auth0Id, {
                    snippetCount: snippets.length,
                    snippets: SnippetMapper.toListDTOs(snippets, auth0Id, favoritedIds),
                }),
            };
        });
    } catch (err) {
        handleError(err, 'getCollectionByShortIdHandler');
    }
}

export async function addSnippetToCollectionHandler(
    payload: ServicePayload<AddCollectionSnippetRequest, { collectionId: string }>
): Promise<ServiceResponse<CollectionDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const collectionId = payload.params?.collectionId;
        const snippetId = payload.body?.snippetId;
        if (!collectionId) throw new CustomError('Collection ID required', 400);
        if (!snippetId) throw new CustomError('Snippet ID required', 400);

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionById(collectionId, t);
            if (!collection) throw new CustomError('Collection not found', 404);
            AuthorizationService.verifyOwnership(collection.auth0Id, auth0Id, 'collection');

            const snippet = await findBySnippetId(snippetId, t);
            if (!snippet) throw new CustomError('Snippet not found', 404);

            const canAdd =
                !snippet.isPrivate || snippet.auth0Id === auth0Id;
            if (!canAdd) {
                throw new CustomError('Forbidden: cannot add another user\'s private snippet', 403);
            }

            const existing = await findCollectionSnippet(collectionId, snippetId, t);
            if (existing) {
                throw new CustomError('Snippet already in collection', 409);
            }

            const maxPos = await getMaxCollectionPosition(collectionId, t);
            await addCollectionSnippet(collectionId, snippetId, maxPos + 1, t);

            const updated = await findCollectionById(collectionId, t);
            const snippetCount = await countCollectionSnippets(collectionId, t);
            return { collection: CollectionMapper.toDTO(updated!, auth0Id, { snippetCount }) };
        });
    } catch (err) {
        handleError(err, 'addSnippetToCollectionHandler');
    }
}

export async function removeSnippetFromCollectionHandler(
    payload: ServicePayload<unknown, { collectionId: string; snippetId: string }>
): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const collectionId = payload.params?.collectionId;
        const snippetId = payload.params?.snippetId;
        if (!collectionId || !snippetId) {
            throw new CustomError('Collection ID and snippet ID required', 400);
        }

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionById(collectionId, t);
            if (!collection) throw new CustomError('Collection not found', 404);
            AuthorizationService.verifyOwnership(collection.auth0Id, auth0Id, 'collection');

            await removeCollectionSnippet(collectionId, snippetId, t);
            return { message: 'Snippet removed from collection' };
        });
    } catch (err) {
        handleError(err, 'removeSnippetFromCollectionHandler');
    }
}

export async function reorderCollectionSnippetsHandler(
    payload: ServicePayload<ReorderCollectionSnippetsRequest, { collectionId: string }>
): Promise<ServiceResponse<null>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) throw new CustomError('Authentication required', 401);

        const collectionId = payload.params?.collectionId;
        const snippetIds = payload.body?.snippetIds;
        if (!collectionId) throw new CustomError('Collection ID required', 400);
        if (!snippetIds) throw new CustomError('snippetIds required', 400);

        return await executeInTransaction(async (t) => {
            const collection = await findCollectionById(collectionId, t);
            if (!collection) throw new CustomError('Collection not found', 404);
            AuthorizationService.verifyOwnership(collection.auth0Id, auth0Id, 'collection');

            const memberships = await findCollectionSnippetsOrdered(collectionId, t);
            const existingIds = new Set(memberships.map((m) => m.snippetId));
            if (
                snippetIds.length !== existingIds.size ||
                snippetIds.some((id) => !existingIds.has(id))
            ) {
                throw new CustomError('snippetIds must match collection membership exactly', 400);
            }

            await setCollectionSnippetPositions(collectionId, snippetIds, t);
            return { message: 'Collection order updated' };
        });
    } catch (err) {
        handleError(err, 'reorderCollectionSnippetsHandler');
    }
}
