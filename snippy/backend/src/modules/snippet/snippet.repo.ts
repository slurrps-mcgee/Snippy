import { Transaction, Sequelize } from "sequelize";
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
    snippetId: string,
    patch: Partial<Snippets>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await Snippets.update(patch, { where: { snippetId }, transaction });
    if (updated === 0) {
        throw new Error('Snippet not found or no changes made');
    }
}
// Update SnippetFiles
export async function updateSnippetFiles(
    snippetFileID: string,
    patch: Partial<SnippetFiles>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await SnippetFiles.update( patch, { where: { snippetFileID }, transaction });
    if (updated === 0) {
        throw new Error('Snippet file not found or no changes made');
    }
}
// Delete Snippet will cascade deleting snippetFiles, comments, favorites, etc.
export async function deleteSnippet(
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Snippets.destroy({ where: { snippetId }, transaction });
}
// #endregion

// #region Snippet READ
// Find snippet by snippetId
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
        // If include fails, try without includes for snippetId uniqueness check
        return await Snippets.findOne({
            where: { snippetId },
            transaction
        });
    }
}

// #region Snippet READ
// Find snippet by snippetId
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
        // If include fails, try without includes for shortId uniqueness check
        return await Snippets.findOne({
            where: { shortId },
            transaction
        });
    }
}

// Search snippets by query (name, description, tags)
export async function searchSnippets(
    query: string,
    offset: number,
    limit: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    // Sanitize query to prevent SQL injection
    // Remove SQL special characters that could be used maliciously
    const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&').trim();
    
    if (!sanitizedQuery) {
        // Return empty results for empty queries
        return { rows: [], count: 0 };
    }

    // Use LOWER() for case-insensitive search on MySQL
    // Sequelize doesn't support Op.iLike for MySQL, so we use Op.like with LOWER
    const searchPattern = `%${sanitizedQuery.toLowerCase()}%`;

    return await Snippets.findAndCountAll({
        where: { 
            isPrivate: false, // Only search public snippets
            [Op.or]: [
                // Case-insensitive search in name
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('Snippets.name')),
                    Op.like,
                    searchPattern
                ),
                // Case-insensitive search in description
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('Snippets.description')),
                    Op.like,
                    searchPattern
                ),
                // Search in tags array (JSON column)
                // This checks if any tag contains the search query
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.cast(Sequelize.col('Snippets.tags'), 'CHAR')),
                    Op.like,
                    searchPattern
                )
            ] 
        },
        include: [
            { model: Users, attributes: ['userName', 'displayName'] }
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
            { model: Users, attributes: ['userName', 'displayName'] }
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
            { model: Users, attributes: ['userName', 'displayName'] }
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
            { model: Users, attributes: ['userName', 'displayName'] }
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
