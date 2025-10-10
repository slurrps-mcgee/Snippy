import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Snippy API',
      version: '0.2.0',
      description: 'API documentation for Snippy',
    },
  },
  apis: [
    path.resolve(__dirname, '../docs/*.yaml'),
    path.resolve(__dirname, '../docs/schema/*.yaml'),
  ], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
