import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    pictureUrl: Joi.string().uri().optional(),
});


export const validateRegister = async (payload: any) => {
    const { error } = registerSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);

    return true;
};

const updateUserSchema = Joi.object({
    userName: Joi.string().optional(),
    displayName: Joi.string().optional(),
    bio: Joi.string().optional(),
    pictureUrl: Joi.string().uri().optional(),
});

export const validateUpdateUser = async (payload: any) => {
    const { error } = updateUserSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    return true;
};