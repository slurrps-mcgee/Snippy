import express from 'express';
import { uploadFile, deleteFile, listAssets } from './resource.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const resourceRouter = express.Router();

resourceRouter.get('/', publicReadLimiter, listAssets);
resourceRouter.post('/', writeLimiter, uploadFile);
resourceRouter.delete('/:assetId', writeLimiter, deleteFile);

export default resourceRouter;
