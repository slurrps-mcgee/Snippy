import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const updateUserSchema = Joi.object({
    user_name: Joi.string().optional(),
    display_name: Joi.string().optional(),
    bio: Joi.string().optional()
});

export const validateUpdateUser = async (payload: any) => {
    const { error } = updateUserSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    return true;
};
