import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './common/utilities/swaggerDocs';
import router from './routes/routes';
import helmet from 'helmet';
import { globalLimiter } from './common/middleware/rate-limit.service';
import { connectDBWithRetry } from './database/sequelize';
import { errorHandler } from './common/middleware/error-handler';
import { version } from '../package.json';
import logger from './common/utilities/logger';
import { auth0Check } from './common/middleware/auth0.service';
import cookie from 'cookie-parser';
import { config, featureFlags, validateConfig } from './config';
import { connectMinioWithRetry } from './database/minio';

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

function sendHealth(_req: express.Request, res: express.Response) {
  res.status(200).json({
    status: 'ok',
    minio: featureFlags.isMinioAvailable,
  });
}

// Liveness probe — public (no JWT). `/api/v1/health` is for the SPA (nginx only proxies `/api/`).
app.get('/health', sendHealth);
app.get('/api/v1/health', sendHealth);

// JWT Middleware to protect /api/v1 routes — except public snippet read + embed HTML
app.use((req, res, next) => {
  const path = req.originalUrl.split('?')[0];
  if (path === '/api/v1/health' || path === '/health') {
    return next();
  }

  if (req.method === 'GET') {
    const isPublicEmbed = /^\/api\/v1\/snippets\/[^/]+\/embed\/?$/.test(path);
    const isPublicSnippetGet =
      /^\/api\/v1\/snippets\/(?!(?:me|public|feed|search|user)(?:\/|$))[^/]+\/?$/.test(path);

    if (isPublicEmbed || isPublicSnippetGet) {
      // Optional auth: attach identity when a valid token is present; ignore missing/invalid tokens
      return auth0Check(req as any, res as any, ((_err?: unknown) => next()) as any);
    }
  }

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
    await connectDBWithRetry();
    logger.info('✅ Database connection established.');

    if(config.minio.enableMinIO) {
      logger.info('⚠️  MinIO integration enabled - attempting connection...');
      await connectMinioWithRetry()
        .then(() => {
          featureFlags.isMinioAvailable = true;
        })
        .catch(error => {
          logger.error('❌ MinIO connection failed:', error);
          logger.error('MinIO integration is enabled but connection failed - server will start without MinIO functionality');
          featureFlags.isMinioAvailable = false;
        });
    } else {
      logger.info('⚠️  MinIO integration disabled - skipping connection');
      featureFlags.isMinioAvailable = false;
    }
    
    // Start the Express server
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