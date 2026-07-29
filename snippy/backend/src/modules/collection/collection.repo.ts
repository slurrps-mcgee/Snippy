import { Transaction } from 'sequelize';
import { Collections } from '../../entities/collection.entity';
import { CollectionSnippets } from '../../entities/collectionSnippet.entity';
import { Snippets } from '../../entities/snippet.entity';
import { Users } from '../../entities/user.entity';

export async function createCollection(
    data: Partial<Collections>,
    transaction?: Transaction
): Promise<Collections> {
    return await Collections.create(data as any, { transaction });
}

export async function updateCollection(
    collectionId: string,
    patch: Partial<Collections>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await Collections.update(patch, { where: { collectionId }, transaction });
    if (updated === 0) {
        throw new Error('Collection not found or no changes made');
    }
}

export async function deleteCollection(
    collectionId: string,
    transaction?: Transaction
): Promise<void> {
    await Collections.destroy({ where: { collectionId }, transaction });
}

export async function findCollectionById(
    collectionId: string,
    transaction?: Transaction
): Promise<Collections | null> {
    return await Collections.findByPk(collectionId, {
        include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        transaction,
    });
}

export async function findCollectionByShortId(
    shortId: string,
    transaction?: Transaction
): Promise<Collections | null> {
    return await Collections.findOne({
        where: { shortId },
        include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        transaction,
    });
}

export async function findMyCollections(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Collections[]; count: number }> {
    return await Collections.findAndCountAll({
        where: { auth0Id },
        include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
        distinct: true,
    });
}

export async function findUserPublicCollections(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Collections[]; count: number }> {
    return await Collections.findAndCountAll({
        where: { auth0Id, isPrivate: false },
        include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
        distinct: true,
    });
}

export async function findCollectionSnippetsOrdered(
    collectionId: string,
    transaction?: Transaction
): Promise<CollectionSnippets[]> {
    return await CollectionSnippets.findAll({
        where: { collectionId },
        include: [{
            model: Snippets,
            include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        }],
        order: [['position', 'ASC']],
        transaction,
    });
}

export async function countCollectionSnippets(
    collectionId: string,
    transaction?: Transaction
): Promise<number> {
    return await CollectionSnippets.count({ where: { collectionId }, transaction });
}

export async function findCollectionSnippet(
    collectionId: string,
    snippetId: string,
    transaction?: Transaction
): Promise<CollectionSnippets | null> {
    return await CollectionSnippets.findOne({
        where: { collectionId, snippetId },
        transaction,
    });
}

export async function getMaxCollectionPosition(
    collectionId: string,
    transaction?: Transaction
): Promise<number> {
    const max = await CollectionSnippets.max('position', {
        where: { collectionId },
        transaction,
    });
    return typeof max === 'number' ? max : -1;
}

export async function addCollectionSnippet(
    collectionId: string,
    snippetId: string,
    position: number,
    transaction?: Transaction
): Promise<CollectionSnippets> {
    return await CollectionSnippets.create(
        { collectionId, snippetId, position } as any,
        { transaction }
    );
}

export async function removeCollectionSnippet(
    collectionId: string,
    snippetId: string,
    transaction?: Transaction
): Promise<number> {
    return await CollectionSnippets.destroy({
        where: { collectionId, snippetId },
        transaction,
    });
}

export async function setCollectionSnippetPositions(
    collectionId: string,
    snippetIds: string[],
    transaction?: Transaction
): Promise<void> {
    await Promise.all(
        snippetIds.map((snippetId, index) =>
            CollectionSnippets.update(
                { position: index },
                { where: { collectionId, snippetId }, transaction }
            )
        )
    );
}
