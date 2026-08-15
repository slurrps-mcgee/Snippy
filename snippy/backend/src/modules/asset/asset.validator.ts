import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';

const assetIdSchema = Joi.object({
    assetId: Joi.string().uuid().required(),
});

const subFolderSchema = Joi.object({
    subFolder: Joi.string().max(64).pattern(/^[a-zA-Z0-9_-]*$/).optional().allow(''),
});

export function validateAssetId(params: { assetId?: string }): void {
    const { error } = assetIdSchema.validate(params, { allowUnknown: true });
    if (error) throw new CustomError(error.message, 400);
}

export function validateAssetSubFolder(body: { subFolder?: string }): void {
    const { error } = subFolderSchema.validate(body, { allowUnknown: true });
    if (error) throw new CustomError(error.message, 400);
}
