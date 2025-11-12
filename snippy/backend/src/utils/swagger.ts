import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Snippy API',
      version: version,
      description: 'API documentation for Snippy',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1 server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authorization',
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, '../modules/**/*.controller.ts'),
  ], // Path to controller files with JSDoc swagger comments
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
