import { Op, Transaction, WhereOptions } from 'sequelize';
import { Favorites } from '../../entities/favorite.entity';
import { Snippets } from '../../entities/snippet.entity';
import { buildTextSearchCondition, snippetWithParentInclude } from '../snippet/snippet.repo';

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
  transaction?: Transaction,
  q?: string
): Promise<{ rows: Snippets[]; count: number }> {
  // Snippets is joined via the `snippet` association (see Favorites.snippet), so the
  // shared search condition is qualified with that alias instead of the default 'Snippets'.
  const searchCondition = buildTextSearchCondition(q, 'snippet');
  const where: WhereOptions = {
    auth0Id,
    ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
  };

  const { rows, count } = await Favorites.findAndCountAll({
    where,
    include: [
      {
        model: Snippets,
        include: snippetWithParentInclude(),
      },
    ],
    order: [['created_at', 'ASC']],
    offset,
    limit,
    transaction,
    distinct: true,
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
