import { Transaction } from "sequelize";
import { Assets } from "../../entities/asset.entity";

// CRUD functions for Assets
export async function createAsset(
    assetData: Partial<Assets>,
    transaction?: Transaction
): Promise<Assets> {
    const created = await Assets.create(assetData as any, { transaction });
    return created;
}

export async function updateAsset(
    assetId: string,
    patch: Partial<Assets>,
    transaction?: Transaction
): Promise<void> {
    const [updated] = await Assets.update(patch, { where: { assetId }, transaction });
    if (updated === 0) {
        throw new Error('Asset not found or no changes made');
    }
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

// READ functions
export async function findByAssetId(
    assetId: string,
    transaction?: Transaction
): Promise<Assets | null> {
    return await Assets.findByPk(assetId, { transaction });
}

export async function findByUrl(
    url: string,
    transaction?: Transaction
): Promise<Assets | null> {
    return await Assets.findOne({ where: { url }, transaction });
}

export async function findByUserId(
    auth0Id: string,
    transaction?: Transaction
): Promise<Assets[]> {
    return await Assets.findAll({ where: { auth0Id: auth0Id }, transaction });
}

export async function findByFileName(
    fileName: string,
    transaction?: Transaction
): Promise<Assets | null> {
    return await Assets.findOne({ where: { fileName }, transaction });
}

export async function haveAssets(transaction?: Transaction): Promise<boolean> {
    const count = await Assets.count({ transaction });
    return count > 0;
}