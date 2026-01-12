import { Request, Response, NextFunction } from 'express';
import { uploadFileHandler, deleteFileHandler } from './resource.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /resources:
 *  post:
 *    tags:
 *     - Resource
 *    summary: Upload a file resource
 *   security:
 *    - bearerAuth: []
 *   requestBody:
 *    required: true
 *    content:
 *     multipart/form-data:
 *      schema:
 *       type: object
 *      properties:
 *       file:
 *        type: string
 *        format: binary
 *       subFolder:
 *        type: string
 *        description: Optional subfolder to store the file in
 *  responses:
 *    '201':
 *    description: File uploaded
 *   '400':
 *   description: Bad request
 *  '401':
 *  description: Unauthorized
 *  '500':
 * description: Internal server error
 * 
 */
export const uploadFile = [
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {url} =await uploadFileHandler(req);

      res.status(201).json({ success: true, url });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * @swagger
 * /resources/{objectName}:
 *  delete:
 *    tags:
 *     - Resource
 *    summary: Delete a file resource
 *   security:
 *    - bearerAuth: []
 *   parameters:
 *    - name: objectName
 *     in: path
 *    required: true
 *    schema:
 *    type: string
 *  description: The name of the object to delete
 *  responses:
 *    '204':
 *    description: File deleted
 *   '400':
 *   description: Bad request
 *  '401':
 *  description: Unauthorized
 *  '403':
 * description: Forbidden
 *  '500':
 * description: Internal server error
 * 
 */
export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteFileHandler(req);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
