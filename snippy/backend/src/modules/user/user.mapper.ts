import { Assets } from '../../entities/asset.entity';
import { Users } from '../../entities/user.entity';
import { AssetDTO, UserDTO } from './dto/user.dto';

/**
 * Maps User entities to DTOs
 */
export class UserMapper {
    /**
     * Map user entity to DTO
     */
    static toDTO(user: Users, includeOwnerFields: boolean = false): UserDTO {
        const dto: UserDTO = {
            userName: user.userName,
            displayName: user.displayName ?? null,
            bio: user.bio ?? null,
            pictureUrl: user.pictureUrl ?? null,
            assets: user.assets ? user.assets.map(asset => this.toAssetDTO(asset)) : []
        };

        if (includeOwnerFields) {
            dto.isAdmin = user.isAdmin;
            dto.isPrivate = user.isPrivate;
        }

        return dto;
    }

    /**
     * Map multiple user entities to DTOs
     */
    static toDTOs(users: Users[], includeOwnerFields: boolean = false): UserDTO[] {
        return users.map(user => this.toDTO(user, includeOwnerFields));
    }

    static toAssetDTO(asset: Assets): AssetDTO {
        return {
            assetId: asset.assetId,
            fileName: asset.fileName,
            fileType: asset.fileType,
            url: asset.url,
            objectKey: asset.objectKey,
        };
    }
}
