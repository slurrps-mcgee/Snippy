import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const inviteSchema = Joi.object({
    email: Joi.string().email().required(),
});


export const validateGenerate = async (payload: any) => {
    const { error } = inviteSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    return true;
};
