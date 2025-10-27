import { Transaction } from "sequelize";
import { sequelize } from "../../config/sequelize";
import { Snippets } from "../../models/snippet.model";
import { SnippetFiles } from "../../models/snippetFile.model";

// #region Snippet CRUD

//CREATE, UPDATE, DELETE
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

//GET Snippet and Snippets
// Get Snippet by Short ID
export async function findByShortId(
    shortId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    return await Snippets.findOne({
        where: { shortId },
        include: [SnippetFiles],
        transaction,
    });
}
// Get Snippet by Primary ID
export async function findByPK(
    snippetId: string,
    transaction?: Transaction
): Promise<Snippets | null> {
    return await Snippets.findByPk(snippetId, {
        include: [SnippetFiles],
        transaction,
    });
}
// Get All Public Snippets with Pagination
export async function findAllPublicSnippets(
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<Snippets[]> {
    return await Snippets.findAll({
        where: { isPrivate: false },
        include: [SnippetFiles],
        offset,
        limit,
        transaction,
    });
}

export async function findAllUserSnippets(
    auth0Id: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<Snippets[]> {
    return await Snippets.findAll({
        where: { auth0Id },
        include: [SnippetFiles],
        offset,
        limit,
        transaction,
    });
}
//HELPERS
// Validate Ownership of Snippet
export async function validateOwnership(
    auth0Id: string,
    shortId: string,
    transaction?: Transaction
): Promise<boolean> {
    const snippet = await Snippets.findOne({
        where: { shortId, auth0Id },
        transaction
    });
    return snippet !== null;
}


// #endregion

// #region Count Management

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
