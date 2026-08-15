import { Assets } from '../../entities/asset.entity';
import { AssetDTO } from './dto/asset.dto';

export class AssetMapper {
    static toDTO(asset: Assets): AssetDTO {
        return {
            assetId: asset.assetId,
            fileName: asset.fileName,
            fileType: asset.fileType,
            url: asset.url,
            objectKey: asset.objectKey,
        };
    }

    static toDTOs(assets: Assets[]): AssetDTO[] {
        return assets.map((asset) => this.toDTO(asset));
    }
}
