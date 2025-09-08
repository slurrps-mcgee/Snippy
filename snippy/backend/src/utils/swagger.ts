import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Snippy API',
      version: '1.0.0',
      description: 'API documentation for Snippy',
    },
  },
  apis: ['./src/docs/*.yaml', './src/docs/schema/*.yaml'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
