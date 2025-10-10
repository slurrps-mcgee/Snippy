import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    inviteCode: Joi.string().optional(),
});


export const validateRegister = async (payload: any) => {
    const { error } = registerSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);

    return true;
};

const updateUserSchema = Joi.object({
    userId: Joi.string().required(),
    user_name: Joi.string().optional(),
    display_name: Joi.string().optional(),
    bio: Joi.string().optional()
});

export const validateUpdateUser = async (payload: any) => {
    const { error } = updateUserSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    return true;
};
