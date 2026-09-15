import { Op, Sequelize, Transaction, WhereOptions } from 'sequelize';
import { Collections } from '../../entities/collection.entity';
import { CollectionSnippets } from '../../entities/collectionSnippet.entity';
import { Snippets } from '../../entities/snippet.entity';
import { Users } from '../../entities/user.entity';
import { buildTextSearchCondition, snippetWithParentInclude } from '../snippet/snippet.repo';
import { buildLikeSearchCondition } from '../../common/utilities/searchCondition';

/** Free-text search over a collection's own name/description (collections have no tags). */
function buildCollectionTextSearchCondition(
  q?: string,
  tableAlias: string = 'Collections'
): WhereOptions | null {
  return buildLikeSearchCondition(q, [{ name: 'name' }, { name: 'description' }], tableAlias);
}

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
  transaction?: Transaction,
  q?: string
): Promise<{ rows: Collections[]; count: number }> {
  const searchCondition = buildCollectionTextSearchCondition(q);
  return await Collections.findAndCountAll({
    where: {
      auth0Id,
      ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
    },
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
  transaction?: Transaction,
  q?: string
): Promise<{ rows: Collections[]; count: number }> {
  const searchCondition = buildCollectionTextSearchCondition(q);
  return await Collections.findAndCountAll({
    where: {
      auth0Id,
      isPrivate: false,
      ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
    },
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
  transaction?: Transaction,
  q?: string
): Promise<CollectionSnippets[]> {
  // Snippets is joined via the `snippet` association (see CollectionSnippets.snippet),
  // so the shared search condition is qualified with that alias.
  const searchCondition = buildTextSearchCondition(q, 'snippet');
  return await CollectionSnippets.findAll({
    where: {
      collectionId,
      ...(searchCondition ? { [Op.and]: [searchCondition] } : {}),
    },
    include: [
      {
        model: Snippets,
        include: snippetWithParentInclude(),
      },
    ],
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

export async function countSnippetsForCollections(
  collectionIds: string[],
  transaction?: Transaction
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (collectionIds.length === 0) {
    return counts;
  }

  const rows = (await CollectionSnippets.findAll({
    attributes: [
      'collectionId',
      [Sequelize.fn('COUNT', Sequelize.col('collection_snippet_id')), 'snippetCount'],
    ],
    where: { collectionId: collectionIds },
    group: ['collectionId'],
    transaction,
    raw: true,
  })) as unknown as Array<{ collectionId: string; snippetCount: number | string }>;

  for (const id of collectionIds) {
    counts.set(id, 0);
  }
  for (const row of rows) {
    counts.set(row.collectionId, Number(row.snippetCount) || 0);
  }
  return counts;
}

export async function findCollectionIdsContainingSnippet(
  collectionIds: string[],
  snippetId: string,
  transaction?: Transaction
): Promise<Set<string>> {
  if (collectionIds.length === 0) return new Set();
  const rows = await CollectionSnippets.findAll({
    attributes: ['collectionId'],
    where: { collectionId: collectionIds, snippetId },
    transaction,
  });
  return new Set(rows.map((r) => r.collectionId));
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
  return await CollectionSnippets.create({ collectionId, snippetId, position } as any, {
    transaction,
  });
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
