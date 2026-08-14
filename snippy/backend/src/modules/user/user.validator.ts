import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';
import { sanitizeInput } from '../../common/utilities/sanitizer';
import { EDITOR_FONT_KEYS, EDITOR_THEME_KEYS } from '../../common/utilities/editor-preferences';

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

const editorPreferencesSchema = Joi.object({
    fontSize: Joi.number().integer().min(10).max(24).optional(),
    fontFamily: Joi.string().valid(...EDITOR_FONT_KEYS).optional(),
    indentWith: Joi.string().valid('spaces', 'tabs').optional(),
    indentWidth: Joi.number().integer().min(1).max(8).optional(),
    lineNumbers: Joi.boolean().optional(),
    lineWrapping: Joi.boolean().optional(),
    codeFolding: Joi.boolean().optional(),
    autocomplete: Joi.boolean().optional(),
    matchBrackets: Joi.boolean().optional(),
    theme: Joi.string().valid(...EDITOR_THEME_KEYS).optional(),
}).optional();

const updateUserSchema = Joi.object({
    userName: Joi.string().max(50).optional(),
    displayName: Joi.string().max(100).optional(),
    bio: Joi.string().max(500).optional(),
    pictureUrl: Joi.string().uri().optional().allow(null, ''),
    isPrivate: Joi.boolean().optional(),
    editorPreferences: editorPreferencesSchema,
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