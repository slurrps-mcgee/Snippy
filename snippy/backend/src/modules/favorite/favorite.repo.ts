import { Transaction } from "sequelize";
import { Favorites } from "../../entities/favorite.entity";
import { Snippets } from "../../entities/snippet.entity";

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
        include: [Snippets],
        order: [['created_at', 'ASC']],
        offset,
        limit,
        transaction,
        distinct: true
    });

    // Extract Snippets from each Favorite
    const snippets = rows
        .map((favorite: any) => favorite.Snippet || favorite.Snippets)
        .filter((snippet: Snippets | undefined) => snippet !== undefined);

    return { rows: snippets, count };
}