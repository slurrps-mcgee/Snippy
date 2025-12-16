import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { Express } from 'express';
import logger from '../utils/logger';

export function setupSwaggerDocs(app: Express) {
  const env = process.env.NODE_ENV || 'development';

  // Only expose Swagger UI in non-production environments
  if (env === 'production') {
    logger.info('Swagger UI is disabled in production environment.');
    return;
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger UI available at /api-docs');
}
