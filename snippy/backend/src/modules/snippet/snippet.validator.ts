import Joi from 'joi';
import { CustomError } from '../../common/exceptions/custom-error';

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
};


const updateSnippetSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).optional().allow(null),
    isPrivate: Joi.boolean().optional(),
    snippetFiles: Joi.array().items(
        Joi.object({
            fileType: Joi.string().min(1).max(255).optional(),
            content: Joi.string().optional().allow(''),
        })
    ).optional(),
});

export const validateUpdateSnippet = (payload: any): void => {
    const { error } = updateSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
};

const forkSnippetSchema = Joi.object({
    shortId: Joi.string().required(),
});

export const validateForkSnippet = (payload: any): void => {
    const { error } = forkSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);
};