import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const registerSchema = Joi.object({
	email: Joi.string().email().required(),
 	password: Joi.string().trim().min(12).max(256)
		.pattern(/(?=.*[A-Za-z])(?=.*\d)/)
		.required()
		.messages({
			'string.min': 'Password must be at least 12 characters',
			'string.max': 'Password is too long',
			'string.pattern.base': 'Password must contain at least one letter and one number',
			'any.required': 'Password is required'
		}),
	inviteCode: Joi.string().optional(),
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const validateRegister = async (payload: any) => {
	const { error, value } = registerSchema.validate(payload);
	if (error) throw new CustomError(error.message, 400);

	// Reject a short list of extremely common passwords
	const common = new Set(['password', '123456', '123456789', 'qwerty', 'letmein', '111111', '12345678']);
	if (value.password && common.has(String(value.password).toLowerCase())) {
		throw new CustomError('Password is too common', 400);
	}

	return true;
};

export const validateLogin = async (payload: any) => {
	const { error } = loginSchema.validate(payload);
	if (error) throw new CustomError(error.message, 400);
	return true;
};
