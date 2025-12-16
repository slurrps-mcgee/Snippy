import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';
import { sanitizeInput } from '../../common/utilities/sanitizer';

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    pictureUrl: Joi.string().uri().optional(),
});

export const validateRegister = (payload: any): void => {
    const { error } = registerSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content
    if (payload.name) {
        payload.name = sanitizeInput(payload.name);
    }
};

const updateUserSchema = Joi.object({
    userName: Joi.string().max(50).optional(),
    displayName: Joi.string().max(100).optional(),
    bio: Joi.string().max(500).optional(),
    pictureUrl: Joi.string().uri().optional(),
});

export const validateUpdateUser = (payload: any): void => {
    const { error } = updateUserSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content to prevent XSS
    if (payload.userName) {
        payload.userName = sanitizeInput(payload.userName);
    }
    if (payload.displayName) {
        payload.displayName = sanitizeInput(payload.displayName);
    }
    if (payload.bio) {
        payload.bio = sanitizeInput(payload.bio);
    }
};