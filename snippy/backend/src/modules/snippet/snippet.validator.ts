import Joi from 'joi';
import { CustomError } from '../../utils/custom-error';

const createSnippetSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    parentSnippetId: Joi.string().uuid().optional().allow(null),
    description: Joi.string().max(1000).optional().allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    isPrivate: Joi.boolean().optional(),
    snippetFiles: Joi.array().items(
        Joi.object({
            fileType: Joi.string().min(1).max(255).required(),
            content: Joi.string().required(),
        })
    )
});


export const validateCreateSnippet = async (payload: any) => {
    const { error } = createSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);

    return true;
};


const updateSnippetSchema = Joi.object({
    shortId: Joi.string().required(),
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    isPrivate: Joi.boolean().optional(),
    snippetFiles: Joi.array().items(
        Joi.object({
            snippetFileID: Joi.string().uuid().required(),
            fileType: Joi.string().min(1).max(255).optional(),
            content: Joi.string().optional(),
        })
    ).optional(),
});

export const validateUpdateSnippet = async (payload: any) => {
    const { error } = updateSnippetSchema.validate(payload);
    if (error) throw new CustomError(error.message, 400);

    return true;
}