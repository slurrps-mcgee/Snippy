import express from 'express';
import { uploadFile, deleteFile, listAssets } from './asset.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const assetRouter = express.Router();

assetRouter.get('/', publicReadLimiter, listAssets);
assetRouter.post('/', writeLimiter, uploadFile);
assetRouter.delete('/:assetId', writeLimiter, deleteFile);

export default assetRouter;
