/**
 * Data Transfer Objects for Comment module
 */

export interface CommentDTO {
    commentId: string;
    content: string;
    userName?: string;
    displayName?: string;
    isOwner: boolean;
    parentId?: string | null;
    mentions?: string[];
    isDeleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCommentRequest {
    content: string;
    parentId?: string;
}

export interface UpdateCommentRequest {
    content: string;
}
