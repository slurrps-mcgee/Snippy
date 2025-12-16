import { Snippets } from '../../entities/snippet.entity';
import { SnippetDTO, SnippetListDTO, SnippetFileDTO } from './dto/snippet.dto';
import { AuthorizationService } from '../../common/services/authorization.service';

/**
 * Mapper for transforming Snippet entities to DTOs
 */
export class SnippetMapper {
    /**
     * Map full snippet entity to DTO
     */
    static toDTO(snippet: Snippets, currentUserId: string | undefined): SnippetDTO {
        return {
            shortId: snippet.shortId,
            name: snippet.name,
            description: snippet.description ?? null,
            tags: snippet.tags ?? null,
            isPrivate: snippet.isPrivate,
            forkCount: snippet.forkCount,
            viewCount: snippet.viewCount,
            commentCount: snippet.commentCount,
            favoriteCount: snippet.favoriteCount,
            parentShortId: snippet.parentShortId ?? null,
            isOwner: currentUserId ? AuthorizationService.isOwner(snippet.auth0Id, currentUserId) : false,
            displayName: (snippet as any).user?.displayName,
            snippetFiles: snippet.snippetFiles?.map(file => this.fileToDTO(file)),
        };
    }

    /**
     * Map snippet entity to list DTO (minimal data for lists)
     */
    static toListDTO(snippet: Snippets, currentUserId?: string): SnippetListDTO {
        return {
            shortId: snippet.shortId,
            name: snippet.name,
            description: snippet.description ?? null,
            tags: snippet.tags ?? null,
            userName: (snippet as any).user?.userName,
            commentCount: snippet.commentCount,
            favoriteCount: snippet.favoriteCount,
            viewCount: snippet.viewCount,
            isOwner: currentUserId ? AuthorizationService.isOwner(snippet.auth0Id, currentUserId) : false,
        };
    }

    /**
     * Map snippet file to DTO
     */
    private static fileToDTO(file: any): SnippetFileDTO {
        return {
            fileType: file.fileType,
            content: file.content,
        };
    }

    /**
     * Map array of snippets to list DTOs
     */
    static toListDTOs(snippets: Snippets[], currentUserId?: string): SnippetListDTO[] {
        return snippets.map(snippet => this.toListDTO(snippet, currentUserId));
    }
}
