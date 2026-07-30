export interface Comment {
  commentId: string;
  content: string;
  userName?: string;
  displayName?: string;
  isOwner: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentListResponse {
  success: boolean;
  comments: Comment[];
  totalCount: number;
}

export interface CommentResponse {
  success: boolean;
  comment: Comment;
}
