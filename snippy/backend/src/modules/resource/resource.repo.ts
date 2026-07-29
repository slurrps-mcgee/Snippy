import { Transaction } from "sequelize";
import { Assets } from "../../entities/asset.entity";

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

export async function findAssetsByUserId(
    auth0Id: string,
    offset?: number,
    limit?: number,
    transaction?: Transaction
): Promise<{ rows: Assets[]; count: number }> {
    return await Assets.findAndCountAll({
        where: { auth0Id },
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction,
    });
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
