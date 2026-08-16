import { Transaction, Op } from "sequelize";
import { Assets } from "../../entities/asset.entity";
import { SnippetFiles } from "../../entities/snippetFile.entity";
import { Snippets } from "../../entities/snippet.entity";

export async function createAsset(
    assetData: Partial<Assets>,
    transaction?: Transaction
): Promise<Assets> {
    return await Assets.create(assetData as any, { transaction });
}

export async function deleteAsset(
    assetId: string,
    transaction?: Transaction
): Promise<void> {
    const deleted = await Assets.destroy({ where: { assetId }, transaction });
    if (deleted === 0) {
        throw new Error('Asset not found');
    }
}

export async function findByAssetId(
    assetId: string,
    transaction?: Transaction
): Promise<Assets | null> {
    return await Assets.findByPk(assetId, { transaction });
}

export async function findByObjectKey(
    auth0Id: string,
    objectKey: string,
    transaction?: Transaction
): Promise<Assets | null> {
    return await Assets.findOne({ where: { auth0Id, objectKey }, transaction });
}

function libraryWhere(auth0Id: string) {
    return {
        auth0Id,
        [Op.and]: [
            { objectKey: { [Op.notLike]: `${auth0Id}/profile/%` } },
            { objectKey: { [Op.notLike]: `${auth0Id}/snippets/%` } },
        ],
    };
}

export async function findAssetsByUserId(
    auth0Id: string,
    offset?: number,
    limit?: number,
    transaction?: Transaction
): Promise<{ rows: Assets[]; count: number }> {
    return await Assets.findAndCountAll({
        where: libraryWhere(auth0Id),
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
    });
}

/** Scan the owner's snippet file contents for asset URL / object-key references. */
export async function countAssetUsageByNeedle(
    auth0Id: string,
    needles: string[],
    transaction?: Transaction
): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const unique = [...new Set(needles.filter(Boolean))];
    for (const needle of unique) counts.set(needle, 0);
    if (unique.length === 0) return counts;

    const files = await SnippetFiles.findAll({
        attributes: ['content'],
        include: [{ model: Snippets, attributes: [], where: { auth0Id }, required: true }],
        transaction,
    });

    for (const file of files) {
        const content = file.content ?? '';
        if (!content) continue;
        for (const needle of unique) {
            if (content.includes(needle)) {
                counts.set(needle, (counts.get(needle) ?? 0) + 1);
            }
        }
    }
    return counts;
}

export async function findAllAssetsByUserId(
    auth0Id: string,
    transaction?: Transaction
): Promise<Assets[]> {
    return await Assets.findAll({
        where: { auth0Id },
        order: [['created_at', 'DESC']],
        transaction,
    });
}
