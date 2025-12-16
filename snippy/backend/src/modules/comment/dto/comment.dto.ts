/**
 * Data Transfer Objects for Comment module
 */

export interface CommentDTO {
    commentId: string;
    content: string;
    userName?: string;
    displayName?: string;
    isOwner: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCommentRequest {
    content: string;
}

export interface UpdateCommentRequest {
    content: string;
}
