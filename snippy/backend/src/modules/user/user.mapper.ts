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
    static toDTO(user: Users, includeAdmin: boolean = false): UserDTO {
        const dto: UserDTO = {
            userName: user.userName,
            displayName: user.displayName ?? null,
            bio: user.bio ?? null,
            pictureUrl: user.pictureUrl ?? null,
            assets: user.assets ? user.assets.map(asset => this.toAssetDTO(asset)) : []
        };

        if (includeAdmin) {
            dto.isAdmin = user.isAdmin;
        }

        return dto;
    }

    /**
     * Map multiple user entities to DTOs
     */
    static toDTOs(users: Users[], includeAdmin: boolean = false): UserDTO[] {
        return users.map(user => this.toDTO(user, includeAdmin));
    }

    static toAssetDTO(asset: Assets): AssetDTO {
        return {
            assetId: asset.assetId,
            fileName: asset.fileName,
            fileType: asset.fileType,
            url: asset.url
        };
    }
}
