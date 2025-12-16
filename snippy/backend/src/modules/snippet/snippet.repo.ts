import { Transaction } from "sequelize";
import { Snippets } from "../../entities/snippet.entity";
import { SnippetFiles } from "../../entities/snippetFile.entity";
import { Users } from "../../entities/user.entity";
import { Op } from "sequelize";

// #region Snippet CREATE/UPDATE/DELETE
// Create Snippet
export async function createSnippet(
    snippetData: Partial<Snippets>,
    transaction?: Transaction
): Promise<Snippets> {
    const created = await Snippets.create(snippetData as any, { transaction });
    return created;
}
// Create Snippet Files
export async function createSnippetFiles(
    snippetFiles: Partial<SnippetFiles>[],
    transaction?: Transaction
): Promise<SnippetFiles[]> {
    const created = await SnippetFiles.bulkCreate(snippetFiles as any, { transaction });
    return created;
}
// Update Snippet
export async function updateSnippet(
    shortId: string,
    patch: Partial<Snippets>,
    transaction?: Transaction
): Promise<boolean> {
    const updated = await Snippets.update(patch, { where: { shortId }, transaction });
    return updated[0] > 0;
}
// Update SnippetFiles
export async function updateSnippetFiles(
    snippetFileID: string,
    patch: Partial<SnippetFiles>,
    transaction?: Transaction
): Promise<boolean> {
    const updated = await SnippetFiles.update( patch, { where: { snippetFileID }, transaction });
    return updated[0] > 0;
}
// Delete Snippet will cascade deleting snippetFiles, comments, favorites, etc.
export async function deleteSnippet(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.destroy({ where: { shortId }, transaction });
}
// #endregion

// #region Snippet READ
// Find snippet by shortId
export async function findByShortId(
    shortId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    return await Snippets.findOne({
        where: { shortId },
        include: [
            SnippetFiles,
            { model: Users, attributes: ['displayName'] }
        ],
        transaction
    });
}
// Search snippets by query (name, description, etc.)
export async function searchSnippets(
    query: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { 
            isPrivate: false, // Only search public snippets
            [Op.or]: [
                { name: { [Op.like]: `%${query}%` } }, 
                { description: { [Op.like]: `%${query}%` } }
            ] 
        },
        include: [
            SnippetFiles,
            { model: Users, attributes: ['userName'] }
        ],
        order: [['created_at', 'DESC']], // Show newest first
        offset,
        limit,
        transaction,
        distinct: true
    });
}
// Get all public snippets
export async function getAllPublicSnippets(
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { isPrivate: false },
        include: [
            SnippetFiles,
            { model: Users, attributes: ['userName'] }
        ],
        order: [['created_at', 'DESC']], // Show newest first
        offset,
        limit,
        transaction,
        distinct: true
    });
}
// Get public snippets for a specific user
export async function getUserPublicSnippets(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { auth0Id, isPrivate: false },
        include: [
            SnippetFiles,
            { model: Users, attributes: ['userName'] }
        ],
        order: [['created_at', 'DESC']], // Show newest first
        offset,
        limit,
        transaction,
        distinct: true
    });
}
// Get snippets for the current user
export async function getMySnippets(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    return await Snippets.findAndCountAll({
        where: { auth0Id },
        include: [
            SnippetFiles,
            { model: Users, attributes: ['userName'] }
        ],
        order: [['created_at', 'DESC']], // Show newest first
        offset,
        limit,
        transaction,
        distinct: true
    });
}
// #endregion

// #region Snippet Count Management
export async function incrementSnippetForkCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet) await snippet.increment("forkCount", { transaction });
}

export async function decrementSnippetForkCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet && snippet.forkCount > 0)
        await snippet.decrement("forkCount", { transaction });
}

export async function incrementSnippetViewCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet) await snippet.increment("viewCount", { transaction });
}

export async function incrementSnippetCommentCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet) await snippet.increment("commentCount", { transaction });
}

export async function decrementSnippetCommentCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet && snippet.commentCount > 0)
        await snippet.decrement("commentCount", { transaction });
}

export async function incrementSnippetFavoriteCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet) await snippet.increment("favoriteCount", { transaction });
}

export async function decrementSnippetFavoriteCount(
    shortId: string,
    transaction?: Transaction
): Promise<void> {
    const snippet = await Snippets.findOne({ where: { shortId }, transaction });
    if (snippet && snippet.favoriteCount > 0)
        await snippet.decrement("favoriteCount", { transaction });
}

// #endregion
