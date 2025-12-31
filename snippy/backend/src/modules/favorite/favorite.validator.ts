import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';

const createOrDeleteFavoriteSchema = Joi.object({
    snippetId: Joi.string().required(),
});

export const validateCreateOrDeleteFavorite = (payload: any): void => {
    const { error } = createOrDeleteFavoriteSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
};
