import { Transaction, Sequelize, Op, WhereOptions, Order } from "sequelize";
import { Snippets } from "../../entities/snippet.entity";
import { SnippetFiles } from "../../entities/snippetFile.entity";
import { Users } from "../../entities/user.entity";
import { SnippetSort } from "./dto/snippet.dto";

export function resolveSnippetOrder(sort?: string): Order {
    switch (sort) {
        case 'views':
            return [['view_count', 'DESC'], ['created_at', 'DESC']];
        case 'favorites':
            return [['favorite_count', 'DESC'], ['created_at', 'DESC']];
        case 'forks':
            return [['fork_count', 'DESC'], ['created_at', 'DESC']];
        case 'newest':
        default:
            return [['created_at', 'DESC']];
    }
}

function buildTagCondition(tag?: string): WhereOptions | undefined {
    if (!tag?.trim()) {
        return undefined;
    }
    const sanitized = tag.trim().replace(/[%_\\]/g, '\\$&');
    // Exact tag string somewhere in JSON array serialization, e.g. "demo"
    return Sequelize.where(
        Sequelize.cast(Sequelize.col('Snippets.tags'), 'CHAR'),
        Op.like,
        `%"${sanitized}"%`
    );
}

function userInclude() {
    return [{ model: Users, attributes: ['userName', 'displayName'] }];
}

// #region Snippet CREATE/UPDATE/DELETE
export async function createSnippet(
    snippetData: Partial<Snippets>,
    transaction?: Transaction
): Promise<Snippets> {
    const created = await Snippets.create(snippetData as any, { transaction });
    return created;
}

export async function createSnippetFiles(
    snippetFiles: Partial<SnippetFiles>[],
    transaction?: Transaction
): Promise<SnippetFiles[]> {
    const created = await SnippetFiles.bulkCreate(snippetFiles as any, { transaction });
    return created;
}

export async function updateSnippet(
    snippetId: string,
    patch: Partial<Snippets>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await Snippets.update(patch, { where: { snippetId }, transaction });
    if (updated === 0) {
        throw new Error('Snippet not found or no changes made');
    }
}

export async function updateSnippetFiles(
    snippetFileID: string,
    patch: Partial<SnippetFiles>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await SnippetFiles.update(patch, { where: { snippetFileID }, transaction });
    if (updated === 0) {
        throw new Error('Snippet file not found or no changes made');
    }
}

export async function deleteSnippet(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.destroy({ where: { snippetId }, transaction });
}
// #endregion

// #region Snippet READ
export async function findBySnippetId(
    snippetId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    try {
        return await Snippets.findByPk(snippetId, {
            include: [
                SnippetFiles,
                { model: Users, attributes: ['userName', 'displayName'] }
            ],
            transaction
        });
    } catch (error) {
        return await Snippets.findOne({
            where: { snippetId },
            transaction
        });
    }
}

export async function findByShortId(
    shortId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    try {
        return await Snippets.findOne({
            where: { shortId },
            include: [
                SnippetFiles,
                { model: Users, attributes: ['userName', 'displayName'] }
            ],
            transaction
        });
    } catch (error) {
        return await Snippets.findOne({
            where: { shortId },
            transaction
        });
    }
}

export async function searchSnippets(
    query: string,
    offset: number,
    limit: number,
    transaction?: Transaction,
    sort?: SnippetSort | string,
    tag?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&').trim();

    if (!sanitizedQuery) {
        return { rows: [], count: 0 };
    }

    const searchPattern = `%${sanitizedQuery.toLowerCase()}%`;
    const tagCondition = buildTagCondition(tag);

    const where: WhereOptions = {
        isPrivate: false,
        [Op.and]: [
            {
                [Op.or]: [
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col('Snippets.name')),
                        Op.like,
                        searchPattern
                    ),
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col('Snippets.description')),
                        Op.like,
                        searchPattern
                    ),
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.cast(Sequelize.col('Snippets.tags'), 'CHAR')),
                        Op.like,
                        searchPattern
                    )
                ]
            },
            ...(tagCondition ? [tagCondition] : []),
        ]
    };

    return await Snippets.findAndCountAll({
        where,
        include: userInclude(),
        order: resolveSnippetOrder(sort),
        offset,
        limit,
        transaction,
        distinct: true
    });
}

export async function getAllPublicSnippets(
    offset: number,
    limit: number,
    transaction?: Transaction,
    sort?: SnippetSort | string,
    tag?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const tagCondition = buildTagCondition(tag);
    const where: WhereOptions = {
        isPrivate: false,
        ...(tagCondition ? { [Op.and]: [tagCondition] } : {}),
    };

    return await Snippets.findAndCountAll({
        where,
        include: userInclude(),
        order: resolveSnippetOrder(sort),
        offset,
        limit,
        transaction,
        distinct: true
    });
}

export async function getUserPublicSnippets(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { auth0Id, isPrivate: false },
        include: userInclude(),
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
        distinct: true
    });
}

export async function getMySnippets(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { auth0Id },
        include: userInclude(),
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
        distinct: true
    });
}

export async function getFeedSnippets(
    followedAuth0Ids: string[],
    offset: number,
    limit: number,
    transaction?: Transaction,
    sort?: SnippetSort | string
): Promise<{ rows: Snippets[]; count: number }> {
    if (!followedAuth0Ids.length) {
        return { rows: [], count: 0 };
    }

    return await Snippets.findAndCountAll({
        where: {
            isPrivate: false,
            auth0Id: { [Op.in]: followedAuth0Ids },
        },
        include: userInclude(),
        order: resolveSnippetOrder(sort),
        offset,
        limit,
        transaction,
        distinct: true
    });
}
// #endregion

// #region Snippet Count Management
export async function incrementSnippetForkCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.increment("forkCount", { where: { snippetId }, transaction });
}

export async function decrementSnippetForkCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.decrement("forkCount", { where: { snippetId }, transaction });
}

export async function incrementSnippetViewCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.increment("viewCount", { where: { snippetId }, transaction });
}

export async function incrementSnippetCommentCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.increment("commentCount", { where: { snippetId }, transaction });
}

export async function decrementSnippetCommentCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.decrement("commentCount", { where: { snippetId }, transaction });
}

export async function incrementSnippetFavoriteCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.increment("favoriteCount", { where: { snippetId }, transaction });
}

export async function decrementSnippetFavoriteCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.decrement("favoriteCount", { where: { snippetId }, transaction });
}
// #endregion
