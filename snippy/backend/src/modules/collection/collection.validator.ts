import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';
import { sanitizeInput } from '../../common/utilities/sanitizer';

const createSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    isPrivate: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    isPrivate: Joi.boolean().optional(),
}).min(1);

const addSnippetSchema = Joi.object({
    snippetId: Joi.string().uuid().required(),
});

const reorderSchema = Joi.object({
    snippetIds: Joi.array().items(Joi.string().uuid()).required(),
});

export function validateCreateCollection(payload: any): void {
    const { error } = createSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    if (payload.name) payload.name = sanitizeInput(payload.name);
    if (payload.description) payload.description = sanitizeInput(payload.description);
}

export function validateUpdateCollection(payload: any): void {
    const { error } = updateSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    if (payload.name) payload.name = sanitizeInput(payload.name);
    if (payload.description) payload.description = sanitizeInput(payload.description);
}

export function validateAddCollectionSnippet(payload: any): void {
    const { error } = addSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
}

export function validateReorderCollectionSnippets(payload: any): void {
    const { error } = reorderSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
}
