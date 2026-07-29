import { Op, Transaction } from "sequelize";
import { Favorites } from "../../entities/favorite.entity";
import { Snippets } from "../../entities/snippet.entity";
import { Users } from "../../entities/user.entity";

// #region Favorite CREATE/DELETE
// Create Favorite
export async function createFavorite(
    favoriteData: Partial<Favorites>,
    transaction?: Transaction
): Promise<Favorites> {
    const created = await Favorites.create(favoriteData as any, { transaction });
    return created;
}

// Delete Favorite
export async function deleteFavorite(
    auth0Id: string,
    snippetId: string,
    transaction?: Transaction
): Promise<void> {
    await Favorites.destroy({ where: { auth0Id, snippetId }, transaction });
}
// #endregion

// #region Favorite READ
// Change to return snippets where favorited by user
export async function findFavoriteSnippetsByUser(
    auth0Id: string,
    offset?: number,
    limit?: number,
    transaction?: Transaction
): Promise<{ rows: Snippets[]; count: number }> {
    const { rows, count } = await Favorites.findAndCountAll({
        where: { auth0Id },
        include: [{
            model: Snippets,
            include: [{ model: Users, attributes: ['userName', 'displayName'] }]
        }],
        order: [['created_at', 'ASC']],
        offset,
        limit,
        transaction,
        distinct: true
    });

    // Extract Snippets from each Favorite (BelongsTo association is `snippet`)
    const snippets = rows
        .map((favorite) => favorite.snippet)
        .filter((snippet): snippet is Snippets => snippet !== undefined && snippet !== null);

    return { rows: snippets, count };
}

export async function findFavoriteSnippetByUserAndSnippet(
    auth0Id: string,
    snippetId: string,
    transaction?: Transaction
): Promise<Favorites | null> {
    return await Favorites.findOne({ where: { auth0Id, snippetId }, transaction });
}

/** Batch-load which of the given snippet IDs the user has favorited */
export async function findFavoritedSnippetIds(
    auth0Id: string,
    snippetIds: string[],
    transaction?: Transaction
): Promise<Set<string>> {
    if (!snippetIds.length) {
        return new Set();
    }
    const rows = await Favorites.findAll({
        where: {
            auth0Id,
            snippetId: { [Op.in]: snippetIds },
        },
        attributes: ['snippetId'],
        transaction,
    });
    return new Set(rows.map((row) => row.snippetId));
}
// #endregion
