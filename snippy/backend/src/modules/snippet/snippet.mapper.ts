import { Snippets } from '../../entities/snippet.entity';
import { SnippetDTO, SnippetListDTO, SnippetFileDTO } from './dto/snippet.dto';
import { AuthorizationService } from '../../common/services/authorization.service';
import { SnippetFiles } from '../../entities/snippetFile.entity';

/**
 * Mapper for transforming Snippet entities to DTOs
 */
export class SnippetMapper {
    /**
     * Map full snippet entity to DTO
     */
    static toDTO(
        snippet: Snippets,
        currentUserId: string | undefined,
        isFavorited?: boolean
    ): SnippetDTO {
        return {
            snippetId: snippet.snippetId,
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
            isFavorited,
            userName: (snippet as any).user?.userName,
            displayName: (snippet as any).user?.displayName,
            snippetFiles: snippet.snippetFiles?.map(file => this.fileToDTO(file)),
            externalResources: snippet.externalResources ?? [],
        };
    }

    /**
     * Map snippet entity to list DTO (minimal data for lists)
     */
    static toListDTO(
        snippet: Snippets,
        currentUserId?: string,
        favoritedIds?: Set<string>,
        followingAuth0Ids?: Set<string>
    ): SnippetListDTO {
        const isOwner = currentUserId
            ? AuthorizationService.isOwner(snippet.auth0Id, currentUserId)
            : false;
        return {
            snippetId: snippet.snippetId,
            shortId: snippet.shortId,
            name: snippet.name,
            description: snippet.description ?? null,
            tags: snippet.tags ?? null,
            userName: (snippet as any).user?.userName,
            displayName: (snippet as any).user?.displayName,
            commentCount: snippet.commentCount,
            favoriteCount: snippet.favoriteCount,
            viewCount: snippet.viewCount,
            isOwner,
            isFavorited: favoritedIds ? favoritedIds.has(snippet.snippetId) : undefined,
            isFollowing: followingAuth0Ids && !isOwner
                ? followingAuth0Ids.has(snippet.auth0Id)
                : undefined,
        };
    }

    /**
     * Map snippet file to DTO
     */
    static fileToDTO(file: SnippetFiles): SnippetFileDTO {
        return {
            snippetFileID: file.snippetFileID,
            fileType: file.fileType,
            content: file.content ?? '',
        };
    }

    /**
     * Map array of snippets to list DTOs
     */
    static toListDTOs(
        snippets: Snippets[],
        currentUserId?: string,
        favoritedIds?: Set<string>,
        followingAuth0Ids?: Set<string>
    ): SnippetListDTO[] {
        return snippets.map(snippet =>
            this.toListDTO(snippet, currentUserId, favoritedIds, followingAuth0Ids)
        );
    }
}
