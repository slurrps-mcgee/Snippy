export interface Assets {
  assetId: string;
  fileName: string;
  fileType: string;
  url: string;
  objectKey?: string;
}

export interface AssetListResponse {
  success: boolean;
  assets: Assets[];
  totalCount?: number;
}

export interface AssetResponse {
  success: boolean;
  asset?: Assets;
  url?: string;
  message?: string;
}
