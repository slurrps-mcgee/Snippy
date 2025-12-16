import { Comments } from '../../entities/comment.entity';
import { CommentDTO } from './dto/comment.dto';
import { AuthorizationService } from '../../common/services/authorization.service';

/**
 * Mapper for transforming Comment entities to DTOs
 */
export class CommentMapper {
    /**
     * Map comment entity to DTO
     */
    static toDTO(comment: Comments, currentUserId?: string): CommentDTO {
        return {
            commentId: comment.commentId,
            content: comment.content,
            userName: (comment as any).user?.userName,
            displayName: (comment as any).user?.displayName,
            isOwner: AuthorizationService.isOwner(comment.auth0Id, currentUserId || ''),
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }

    /**
     * Map array of comments to DTOs
     */
    static toDTOs(comments: Comments[], currentUserId?: string): CommentDTO[] {
        return comments.map(comment => this.toDTO(comment, currentUserId));
    }
}
