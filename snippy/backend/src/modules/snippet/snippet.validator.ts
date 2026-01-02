import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';
import { sanitizeInput, sanitizeInputArray } from '../../common/utilities/sanitizer';

const createSnippetSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    parentShortId: Joi.string().length(7).optional().allow(null),
    description: Joi.string().max(1000).optional().allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).optional().allow(null),
    isPrivate: Joi.boolean().optional(),
    snippetFiles: Joi.array().optional().items(
        Joi.object({
            fileType: Joi.string().min(1).max(255).required(),
            content: Joi.string().optional().allow(''),
        })
    )
});


export const validateCreateSnippet = (payload: any): void => {
    const { error } = createSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content to prevent XSS
    if (payload.name) {
        payload.name = sanitizeInput(payload.name);
    }
    if (payload.description) {
        payload.description = sanitizeInput(payload.description);
    }
    if (payload.tags) {
        payload.tags = sanitizeInputArray(payload.tags);
    }
    if (payload.snippetFiles && Array.isArray(payload.snippetFiles)) {
        payload.snippetFiles = payload.snippetFiles.map((file: any) => ({
            ...file,
            fileType: sanitizeInput(file.fileType),
            // Note: content is code, so we preserve it as-is for syntax highlighting
        }));
    }
};


const updateSnippetSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).optional().allow(null),
    isPrivate: Joi.boolean().optional(),
    snippetFiles: Joi.array().items(
        Joi.object({
            snippetFileID: Joi.string().uuid().optional(),
            fileType: Joi.string().valid('html','css', 'js').optional(),
            content: Joi.string().optional().allow(''),
        })
    ).optional(),
    externalResources: Joi.array().items(
        Joi.object({
            externalId: Joi.string().uuid().optional(),
            resourceType: Joi.string().valid('css', 'js').optional(),
            url: Joi.string().uri().optional(),
        })
    ).optional(),
});

export const validateUpdateSnippet = (payload: any): void => {
    const { error } = updateSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
    
    // Sanitize user-generated content to prevent XSS
    if (payload.name) {
        payload.name = sanitizeInput(payload.name);
    }
    if (payload.description) {
        payload.description = sanitizeInput(payload.description);
    }
    if (payload.tags) {
        payload.tags = sanitizeInputArray(payload.tags);
    }
    if (payload.snippetFiles && Array.isArray(payload.snippetFiles)) {
        payload.snippetFiles = payload.snippetFiles.map((file: any) => ({
            ...file,
            fileType: file.fileType ? sanitizeInput(file.fileType) : file.fileType,
            // Note: content is code, so we preserve it as-is for syntax highlighting
        }));
    }
};

const forkSnippetSchema = Joi.object({
    shortId: Joi.string().required(),
});

export const validateForkSnippet = (payload: any): void => {
    const { error } = forkSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
};