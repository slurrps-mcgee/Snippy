import { FavoriteStatusDTO, FavoriteToggleDTO } from './dto/favorite.dto';

export class FavoriteMapper {
    static toToggleDTO(isFavorited: boolean, favoriteCount: number): FavoriteToggleDTO {
        return { isFavorited, favoriteCount };
    }

    static toStatusDTO(isFavorited: boolean): FavoriteStatusDTO {
        return { isFavorited };
    }
}
