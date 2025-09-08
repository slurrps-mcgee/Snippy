import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { Express } from 'express';

export function setupSwaggerDocs(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
