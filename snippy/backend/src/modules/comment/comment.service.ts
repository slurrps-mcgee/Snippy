import { CustomError } from '../../common/exceptions/custom-error';
import { handleError } from '../../common/utilities/error';
import { executeInTransaction } from '../../common/utilities/transaction';
import { AuthorizationService } from '../../common/services/authorization.service';
import { PaginationService, PaginationQuery } from '../../common/services/pagination.service';
import { CommentMapper } from './comment.mapper';
import { CommentDTO, CreateCommentRequest, UpdateCommentRequest } from './dto/comment.dto';
import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import {
  createComment,
  deleteComment,
  findCommentByCommentId,
  findCommentsBySnippetId,
  updateComment,
  countReplies,
} from './comment.repo';
import {
  decrementSnippetCommentCount,
  findBySnippetId,
  incrementSnippetCommentCount,
} from '../snippet/snippet.repo';
import { findUserNamesByNames } from '../user/user.repo';

/**
 * Protected fields that cannot be updated through the updateComment endpoint
 * These fields are system-managed and should not be modified by users
 */
const PROTECTED_COMMENT_FIELDS = ['auth0Id', 'snippetId', 'commentId', 'parentCommentId'] as const;

const MENTION_RE = /@([A-Za-z0-9_-]{2,32})/g;

async function resolveMentions(content: string, transaction?: any): Promise<string[]> {
  const names = [...new Set([...content.matchAll(MENTION_RE)].map((m) => m[1]))].slice(0, 10);
  if (!names.length) return [];
  return findUserNamesByNames(names, transaction);
}

export async function addCommentHandler(
  payload: ServicePayload<CreateCommentRequest, { snippetId: string }>
): Promise<ServiceResponse<CommentDTO>> {
  try {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
      throw new CustomError('Authentication required', 401);
    }

    const snippetId = payload.params?.snippetId;
    if (!snippetId) {
      throw new CustomError('Snippet ID required', 400);
    }

    const snippet = await findBySnippetId(snippetId);

    if (!snippet) {
      throw new CustomError('Snippet not found', 404);
    }

    if (snippet.isPrivate && snippet.auth0Id !== auth0Id) {
      throw new CustomError('Forbidden: cannot comment on a private snippet', 403);
    }

    return await executeInTransaction(async (t) => {
      let parentCommentId: string | null = null;
      const parentId = payload.body?.parentId;
      if (parentId) {
        const parent = await findCommentByCommentId(parentId, t);
        if (!parent || parent.snippetId !== snippet.snippetId) {
          throw new CustomError('Parent comment not found', 404);
        }
        if (parent.parentCommentId) {
          throw new CustomError('Replies can only be one level deep', 400);
        }
        parentCommentId = parent.commentId;
      }

      const body = payload.body;
      if (!body?.content) {
        throw new CustomError('Comment content required', 400);
      }
      const mentions = await resolveMentions(body.content, t);

      const createdComment = await createComment(
        {
          auth0Id,
          content: body.content,
          snippetId: snippet.snippetId,
          parentCommentId,
          mentions,
        },
        t
      );

      await incrementSnippetCommentCount(snippet.snippetId, t);
      const newComment = await findCommentByCommentId(createdComment.commentId, t);

      if (!newComment) {
        throw new CustomError('Failed to retrieve created comment', 500);
      }

      return { comment: CommentMapper.toDTO(newComment, auth0Id) };
    }, 'addComment');
  } catch (error) {
    handleError(error, 'addComment');
  }
}

export async function updateCommentHandler(
  payload: ServicePayload<UpdateCommentRequest, { commentId: string }>
): Promise<ServiceResponse<CommentDTO>> {
  try {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
      throw new CustomError('Authentication required', 401);
    }

    const commentId = payload.params?.commentId;
    if (!commentId) {
      throw new CustomError('Comment ID required', 400);
    }

    const patch = payload.body;
    if (patch) {
      // Remove protected fields to prevent unauthorized modifications
      PROTECTED_COMMENT_FIELDS.forEach((field) => {
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
      return { comment: CommentMapper.toDTO(comment!, auth0Id) };
    });
  } catch (error) {
    handleError(error, 'updateComment');
  }
}

export async function deleteCommentHandler(
  payload: ServicePayload<unknown, { commentId: string }>
): Promise<ServiceResponse<never>> {
  try {
    const auth0Id = payload.auth?.payload?.sub;
    if (!auth0Id) {
      throw new CustomError('Authentication required', 401);
    }

    const commentId = payload.params?.commentId;
    if (!commentId) {
      throw new CustomError('Comment ID required', 400);
    }

    return await executeInTransaction(async (t) => {
      const comment = await findCommentByCommentId(commentId, t);

      if (!comment) {
        throw new CustomError('Comment not found', 404);
      }

      const snippet = await findBySnippetId(comment.snippetId, t);
      if (!snippet) {
        throw new CustomError('Snippet not found', 404);
      }

      const isCommentAuthor = comment.auth0Id === auth0Id;
      const isSnippetOwner = snippet.auth0Id === auth0Id;
      if (!isCommentAuthor && !isSnippetOwner) {
        throw new CustomError('Forbidden: not comment or snippet owner', 403);
      }

      const replyCount = await countReplies(comment.commentId, t);
      if (replyCount > 0) {
        await updateComment(commentId, { isDeleted: true, content: '' } as any, t);
      } else {
        await deleteComment(commentId, t);
        await decrementSnippetCommentCount(comment.snippetId, t);
      }

      return { message: 'Comment deleted successfully' };
    });
  } catch (error) {
    handleError(error, 'removeComment');
  }
}

export async function getCommentsBySnippetIdHandler(
  payload: ServicePayload<unknown, { snippetId: string }, PaginationQuery>
): Promise<ServiceResponse<CommentDTO>> {
  try {
    const snippetId = payload.params?.snippetId;
    if (!snippetId) {
      throw new CustomError('Snippet ID required', 400);
    }

    const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});
    const auth0Id = payload.auth?.payload?.sub;

    return await executeInTransaction(async (t) => {
      const snippet = await findBySnippetId(snippetId);

      if (!snippet) {
        throw new CustomError('Snippet not found', 404);
      }

      if (snippet.isPrivate && snippet.auth0Id !== auth0Id) {
        throw new CustomError('Forbidden: private snippet', 403);
      }

      const { rows: comments, count } = await findCommentsBySnippetId(
        snippet.snippetId,
        offset,
        limit,
        t
      );

      return {
        comments: CommentMapper.toDTOs(comments || [], auth0Id),
        totalCount: count,
      };
    });
  } catch (error) {
    handleError(error, 'getCommentsBySnippetId');
  }
}
