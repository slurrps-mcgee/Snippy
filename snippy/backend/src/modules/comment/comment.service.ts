import { sequelize } from "../../database/sequelize";
import { CustomError } from "../../common/exceptions/custom-error";
import { handleError } from "../../common/utilities/error";
import { executeInTransaction } from "../../common/utilities/transaction";
import { AuthorizationService } from "../../common/services/authorization.service";
import { PaginationService, PaginationQuery } from "../../common/services/pagination.service";
import { CommentMapper } from "./comment.mapper";
import { CommentDTO, CreateCommentRequest, UpdateCommentRequest } from "./dto/comment.dto";
import { ServicePayload } from "../../common/interfaces/servicePayload.interface";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import {
    createComment,
    deleteComment,
    findCommentByCommentId,
    findCommentsBySnippetId,
    updateComment,
} from "./comment.repo";
import { decrementSnippetCommentCount, findByShortId, incrementSnippetCommentCount } from "../snippet/snippet.repo";

/**
 * Protected fields that cannot be updated through the updateComment endpoint
 * These fields are system-managed and should not be modified by users
 */
const PROTECTED_COMMENT_FIELDS = ['auth0Id', 'snippetId', 'commentId'] as const;

export async function addCommentHandler(payload: ServicePayload<CreateCommentRequest, { shortId: string }>): Promise<ServiceResponse<CommentDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const shortId = payload.params?.shortId;
        if (!shortId) {
            throw new CustomError("Snippet ID required", 400);
        }

        const snippet = await findByShortId(shortId);

        if (!snippet) {
            throw new CustomError('Snippet not found', 404);
        }

        return await executeInTransaction(async (t) => {
            const createdComment = await createComment(
                {
                    auth0Id,
                    ...payload.body,
                    snippetId: snippet.snippetId
                }, t);

            await incrementSnippetCommentCount(snippet.shortId, t);
            const newComment = await findCommentByCommentId(createdComment.commentId, t);

            if (!newComment) {
                throw new CustomError('Failed to retrieve created comment', 500);
            }

            return { comment: CommentMapper.toDTO(newComment) };
        }, 'addComment');

    } catch (error) {
        handleError(error, 'addComment');
    }
}

export async function updateCommentHandler(payload: ServicePayload<UpdateCommentRequest, { commentId: string }>): Promise<ServiceResponse<CommentDTO>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const commentId = payload.params?.commentId;
        if (!commentId) {
            throw new CustomError("Comment ID required", 400);
        }

        const patch = payload.body;
        if (patch) {
            // Remove protected fields to prevent unauthorized modifications
            PROTECTED_COMMENT_FIELDS.forEach(field => {
                delete (patch as any)[field];
            });
        }

        return await executeInTransaction(async (t) => {
            let comment = await findCommentByCommentId(commentId, t);

            if (!comment) {
                throw new CustomError('Comment not found', 404);
            }

            AuthorizationService.verifyOwnership(comment.auth0Id, auth0Id, 'comment');

            if (!patch) {
                throw new CustomError('No update data provided', 400);
            }

            await updateComment(commentId, patch as any, t);

            comment = await findCommentByCommentId(commentId, t);
            return { comment: CommentMapper.toDTO(comment!) };
        });
    } catch (error) {
        handleError(error, 'updateComment');
    }
}

export async function deleteCommentHandler(payload: ServicePayload<unknown, { commentId: string }>): Promise<ServiceResponse<never>> {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        if (!auth0Id) {
            throw new CustomError("Authentication required", 401);
        }

        const commentId = payload.params?.commentId;
        if (!commentId) {
            throw new CustomError("Comment ID required", 400);
        }

        return await executeInTransaction(async (t) => {
            const comment = await findCommentByCommentId(commentId, t);
            
            if (!comment) {
                throw new CustomError('Comment not found', 404);
            }

            AuthorizationService.verifyOwnership(comment.auth0Id, auth0Id, 'comment');

            await deleteComment(commentId, t);
            await decrementSnippetCommentCount(comment.snippetId, t);

            return { message: 'Comment deleted successfully' };
        });

    } catch (error) {
        handleError(error, 'removeComment');
    }
}

export async function getCommentsBySnippetIdHandler(payload: ServicePayload<unknown, { shortId: string }, PaginationQuery>): Promise<ServiceResponse<CommentDTO>> {
    try {
        const shortId = payload.params?.shortId;
        if (!shortId) {
            throw new CustomError("Snippet ID required", 400);
        }

        const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
        const auth0Id = payload.auth?.payload?.sub;

        return await executeInTransaction(async (t) => {
            const snippet = await findByShortId(shortId);

            if (!snippet) {
                throw new CustomError('Snippet not found', 404);
            }

            const { rows: comments, count } = await findCommentsBySnippetId(
                snippet.snippetId,
                offset,
                limit,
                t
            );

            return { 
                comments: CommentMapper.toDTOs(comments || [], auth0Id),
                total: count
            };
        });
    } catch (error) {
        handleError(error, 'getCommentsBySnippetId');
    }
}