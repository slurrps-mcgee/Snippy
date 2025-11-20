import { sequelize } from "../../config/sequelize";
import { CustomError } from "../../utils/custom-error";
import { handleError } from "../../utils/error-handler";
import { Comments } from "../../models/comment.model";
import {
    createComment,
    deleteComment,
    findCommentByCommentId,
    findCommentsBySnippetId,
    updateComment,
} from "./comment.repo";
import { findByShortId } from "../snippet/snippet.repo";

// do so as async functions
export async function addCommentHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;

        const snippet = await findByShortId(payload.params.shortId);

        return await sequelize.transaction(async (t) => {
            var newComment = await createComment(
                {
                    auth0Id,
                    ...payload.body,
                    snippetId: snippet?.snippetId!
                }, t);

            newComment = await findCommentByCommentId(newComment.commentId, t) as any;

            return { comment: sanitizeComment(newComment) };
        });

    } catch (error) {
        handleError(error, 'addComment');
    }
}

export async function updateCommentHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const commentId = payload.params.commentId;
        const patch = payload.body;

        delete patch.auth0Id; // Prevent changing ownership
        delete patch.snippetId; // Prevent changing snippet association
        delete patch.commentId; // Prevent changing comment ID

        return await sequelize.transaction(async (t) => {
            var comment = await findCommentByCommentId(commentId, t);

            if (!comment) {
                throw new CustomError('Comment not found', 404);
            }

            const ownsComment = comment.auth0Id === auth0Id;

            if (!ownsComment) {
                throw new CustomError('Unauthorized to update this comment', 401);
            }

            const updated = await updateComment(commentId, patch, t);

            if (updated) {
                comment = await findCommentByCommentId(commentId, t) as any;
                return { comment: sanitizeComment(comment!) };
            }
            else {
                throw new CustomError('Failed to update comment', 500);
            }
        });
    } catch (error) {
        handleError(error, 'updateComment');
    }
}

export async function deleteCommentHandler(payload: any) {
    try {
        const auth0Id = payload.auth?.payload?.sub;
        const commentId = payload.params.commentId;

        return await sequelize.transaction(async (t) => {
            const comment = await findCommentByCommentId(commentId, t);
            
            if (!comment) {
                throw new CustomError('Comment not found', 404);
            }

            const ownsComment = comment.auth0Id === auth0Id;

            if (!ownsComment) {
                throw new CustomError('Unauthorized to delete this comment', 401);
            }

            await deleteComment(commentId, t);

            return { message: 'Comment deleted successfully' };
        });

    } catch (error) {
        handleError(error, 'removeComment');
    }
}

export async function getCommentsBySnippetIdHandler(payload: any){
    try {
        return await sequelize.transaction(async (t) => {
            const snippet = await findByShortId(payload.params.shortId);

            if (!snippet) {
                throw new CustomError('Snippet not found', 404);
            }

            const comments = await findCommentsBySnippetId(
                snippet.snippetId,
                t
            );

            return { comments: comments?.map(sanitizeComment)}
        });
    } catch (error) {
        handleError(error, 'getCommentsBySnippetId');
    }
}

function sanitizeComment(comment: Comments) {
    return {
        commentId: comment.commentId,
        content: comment.content,
    };
}

