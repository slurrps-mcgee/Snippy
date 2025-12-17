import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './common/utilities/swaggerDocs';
import router from './routes/routes';
import helmet from 'helmet';
import { globalLimiter } from './common/middleware/rate-limit.service';
import connectWithRetry from './database/sequelize';
import { errorHandler } from './common/middleware/error-handler';
import { version } from '../package.json';
import logger from './common/utilities/logger';
import { auth0Check } from './common/middleware/auth0.service';
import cookie from 'cookie-parser';
import { config, validateConfig } from './config';

// Validate required environment variables
validateConfig();

const app = express();
app.set('trust proxy', 1);

// Swagger setup
setupSwaggerDocs(app);

app.use(cookie());

//Security middleware
app.use(helmet());

// CORS setup — only allow frontend
app.use(cors({
  origin: config.frontend.url,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Global rate limiting - baseline protection
app.use(globalLimiter);

app.use(express.json());

// JWT Middleware to protect all routes
app.use((req, res, next) => {
  return auth0Check(req as any, res as any, next as any);
});

// Routes
app.use('/api/v1', router);

// Error handling middleware should be the last middleware
app.use(errorHandler);

// Start the server after ensuring DB connection
const startServer = async () => {
  try {
    // Connect to the database - must succeed before starting server
    await connectWithRetry();
    logger.info('✅ Database connection established.');

    app.listen(config.server.port, () => {
      logger.info(`🚀 Snippy API v${version} started on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    logger.error('Database connection required - server will not start');
    process.exit(1); // Exit with error code to prevent silent failures
  }
};

// Invoke the function to start the server
startServer();