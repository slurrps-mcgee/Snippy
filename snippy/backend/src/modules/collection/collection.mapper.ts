import { Collections } from '../../entities/collection.entity';
import { AuthorizationService } from '../../common/services/authorization.service';
import { CollectionDTO } from './dto/collection.dto';
import { SnippetListDTO } from '../snippet/dto/snippet.dto';

export class CollectionMapper {
    static toDTO(
        collection: Collections,
        currentUserId?: string,
        extras?: { snippetCount?: number; snippets?: SnippetListDTO[] }
    ): CollectionDTO {
        return {
            collectionId: collection.collectionId,
            shortId: collection.shortId,
            name: collection.name,
            description: collection.description ?? null,
            isPrivate: collection.isPrivate,
            isOwner: currentUserId
                ? AuthorizationService.isOwner(collection.auth0Id, currentUserId)
                : false,
            userName: (collection as any).user?.userName,
            displayName: (collection as any).user?.displayName,
            snippetCount: extras?.snippetCount,
            snippets: extras?.snippets,
        };
    }

    static toDTOs(collections: Collections[], currentUserId?: string): CollectionDTO[] {
        return collections.map((c) => this.toDTO(c, currentUserId));
    }
}
