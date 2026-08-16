import { Snippets } from '../../entities/snippet.entity';
import { SnippetDTO, SnippetListDTO, SnippetFileDTO } from './dto/snippet.dto';
import { AuthorizationService } from '../../common/services/authorization.service';
import { SnippetFiles } from '../../entities/snippetFile.entity';

/**
 * Mapper for transforming Snippet entities to DTOs
 */
export class SnippetMapper {
    private static parentFields(snippet: Snippets): {
        parentShortId: string | null;
        parentName: string | null;
        parentUserName: string | null;
        parentDeleted: boolean;
    } {
        const parent = (snippet as any).parent as Snippets | null | undefined;
        const liveName = parent?.name ?? null;
        const liveUser = (parent as any)?.user?.userName ?? null;
        const parentShortId = snippet.parentShortId ?? null;
        return {
            parentShortId,
            parentName: liveName ?? snippet.parentName ?? null,
            parentUserName: liveUser ?? snippet.parentUserName ?? null,
            parentDeleted: !!parentShortId && parent === null,
        };
    }

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
            ...this.parentFields(snippet),
            isOwner: currentUserId ? AuthorizationService.isOwner(snippet.auth0Id, currentUserId) : false,
            isFavorited,
            userName: (snippet as any).user?.userName,
            displayName: (snippet as any).user?.displayName,
            snippetFiles: snippet.snippetFiles?.map(file => this.fileToDTO(file)),
            cdnResources: snippet.cdnResources ?? [],
            snapshotUrl: snippet.snapshotUrl ?? null,
            embedCount: snippet.embedCount ?? 0,
            shareToken: currentUserId && AuthorizationService.isOwner(snippet.auth0Id, currentUserId)
                ? snippet.shareToken ?? null
                : undefined,
            updatedAt: this.updatedAtIso(snippet),
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
            forkCount: snippet.forkCount,
            ...this.parentFields(snippet),
            isOwner,
            isFavorited: favoritedIds ? favoritedIds.has(snippet.snippetId) : undefined,
            isFollowing: followingAuth0Ids && !isOwner
                ? followingAuth0Ids.has(snippet.auth0Id)
                : undefined,
            snapshotUrl: snippet.snapshotUrl ?? null,
            embedCount: snippet.embedCount ?? 0,
            updatedAt: this.updatedAtIso(snippet),
        };
    }

    private static updatedAtIso(snippet: Snippets): string {
        const value = snippet.updatedAt;
        if (value instanceof Date) return value.toISOString();
        return value ? String(value) : new Date().toISOString();
    }

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
