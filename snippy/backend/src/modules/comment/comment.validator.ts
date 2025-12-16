import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';
import { sanitizeInput } from '../../common/utilities/sanitizer';

const createCommentSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required(),
});

export const validateCreateComment = (payload: any): void => {
    const { error } = createCommentSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content to prevent XSS
    if (payload.content) {
        payload.content = sanitizeInput(payload.content);
    }
};

const updateCommentSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required(),
});

export const validateUpdateComment = (payload: any): void => {
    const { error } = updateCommentSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content to prevent XSS
    if (payload.content) {
        payload.content = sanitizeInput(payload.content);
    }
};
