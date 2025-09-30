import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const registerSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
    inviteCode: Joi.string().optional(),
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const validateRegister = async (payload: any) => {
	const { error } = registerSchema.validate(payload);
	if (error) throw new CustomError(error.message, 400);
	return true;
};

export const validateLogin = async (payload: any) => {
	const { error } = loginSchema.validate(payload);
	if (error) throw new CustomError(error.message, 400);
	return true;
};
