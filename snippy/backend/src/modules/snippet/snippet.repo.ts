import { Transaction, Op, WhereOptions, Order } from "sequelize";
import { Snippets } from "../../entities/snippet.entity";
import { SnippetFiles } from "../../entities/snippetFile.entity";
import { Users } from "../../entities/user.entity";
import { SnippetSort } from "./dto/snippet.dto";
import { buildFullTextSearchCondition, buildJsonContainsTagCondition } from "../../common/utilities/searchCondition";

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

function buildTagCondition(tag?: string, tableAlias: string = 'Snippets'): WhereOptions | undefined {
    return buildJsonContainsTagCondition(tag, tableAlias);
}

/**
 * Shared free-text search condition for snippets: case-insensitive match against
 * name, description, and tags (JSON array cast to text). Used by every snippet list
 * endpoint that accepts an optional `q` param, as well as by associations that join
 * out to Snippets (favorites, collection snippets) via a custom `tableAlias`.
 *
 * Returns `null` when `q` is empty so callers can leave existing behavior unchanged.
 */
export function buildTextSearchCondition(q?: string | null, tableAlias: string = 'Snippets'): WhereOptions | null {
    return buildFullTextSearchCondition(q, tableAlias);
}

/** Owner user + optional parent snippet (with parent owner) for list/detail DTO mapping. */
export function snippetWithParentInclude() {
    return [
        { model: Users, attributes: ['userName', 'displayName'] },
        {
            model: Snippets,
            as: 'parent',
            attributes: ['shortId', 'name'],
            required: false,
            include: [{ model: Users, attributes: ['userName', 'displayName'] }],
        },
    ];
}

function listInclude() {
    return snippetWithParentInclude();
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
    return await Snippets.findByPk(snippetId, {
        include: [
            SnippetFiles,
            { model: Users, attributes: ['userName', 'displayName'] }
        ],
        transaction
    });
}

export async function findByShortId(
    shortId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    return await Snippets.findOne({
        where: { shortId },
        include: [
            SnippetFiles,
            ...snippetWithParentInclude(),
        ],
        transaction
    });
}

export async function findByShareToken(
    shareToken: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    return await Snippets.findOne({
        where: { shareToken },
        include: [
            SnippetFiles,
            ...snippetWithParentInclude(),
        ],
        transaction
    });
}

export async function searchSnippets(
    query: string,
    offset: number,
    limit: number,
    transaction?: Transaction,
    sort?: SnippetSort | string,
    tag?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const searchCondition = buildTextSearchCondition(query);

    if (!searchCondition) {
        return { rows: [], count: 0 };
    }

    const tagCondition = buildTagCondition(tag);

    const where: WhereOptions = {
        isPrivate: false,
        [Op.and]: [
            searchCondition,
            ...(tagCondition ? [tagCondition] : []),
        ]
    };

    return await Snippets.findAndCountAll({
        where,
        include: listInclude(),
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
    tag?: string,
    q?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const tagCondition = buildTagCondition(tag);
    const searchCondition = buildTextSearchCondition(q);
    const andConditions = [tagCondition, searchCondition].filter((c): c is WhereOptions => !!c);
    const where: WhereOptions = {
        isPrivate: false,
        ...(andConditions.length ? { [Op.and]: andConditions } : {}),
    };

    return await Snippets.findAndCountAll({
        where,
        include: listInclude(),
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
    transaction?: Transaction,
    q?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const searchCondition = buildTextSearchCondition(q);
    const where: WhereOptions = {
        auth0Id,
        isPrivate: false,
        ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
    };

    return await Snippets.findAndCountAll({
        where,
        include: listInclude(),
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
    transaction?: Transaction,
    q?: string
): Promise<{ rows: Snippets[]; count: number }> {
    const searchCondition = buildTextSearchCondition(q);
    const where: WhereOptions = {
        auth0Id,
        ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
    };

    return await Snippets.findAndCountAll({
        where,
        include: listInclude(),
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
    sort?: SnippetSort | string,
    q?: string
): Promise<{ rows: Snippets[]; count: number }> {
    if (!followedAuth0Ids.length) {
        return { rows: [], count: 0 };
    }

    const searchCondition = buildTextSearchCondition(q);

    return await Snippets.findAndCountAll({
        where: {
            isPrivate: false,
            auth0Id: { [Op.in]: followedAuth0Ids },
            ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
        },
        include: listInclude(),
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

export async function incrementSnippetEmbedCount(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.increment("embedCount", { where: { snippetId }, transaction });
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
