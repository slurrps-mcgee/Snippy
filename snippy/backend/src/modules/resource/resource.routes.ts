import express from 'express';
import { uploadFile, deleteFile } from './resource.controller';
import { writeLimiter } from '../../common/middleware/rate-limit.service';

const resourceRouter = express.Router();

resourceRouter.post('/', writeLimiter, uploadFile);
resourceRouter.delete('/:objectName', writeLimiter, deleteFile);

export default resourceRouter;