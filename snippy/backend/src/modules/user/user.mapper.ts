import { Users } from '../../entities/user.entity';
import { UserDTO } from './dto/user.dto';

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
}
