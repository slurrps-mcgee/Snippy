import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './common/utilities/swaggerDocs';
import router from './routes/routes';
import helmet from 'helmet';
import { globalLimiter } from './common/middleware/rate-limit.service';
import { connectDBWithRetry, sequelize } from './database/sequelize';
import { errorHandler } from './common/middleware/error-handler';
import { requestIdMiddleware, requestLogMiddleware } from './common/middleware/request-id';
import { version } from '../package.json';
import logger from './common/utilities/logger';
import { auth0Check } from './common/middleware/auth0.service';
import { isOptionalJwtGet } from './common/middleware/optional-jwt';
import cookie from 'cookie-parser';
import { config, featureFlags, validateConfig } from './config';
import { connectMinioWithRetry, minioClient } from './database/minio';

validateConfig();

const app = express();
app.set('trust proxy', 1);

setupSwaggerDocs(app);

app.use(requestIdMiddleware);
app.use(cookie());
app.use(helmet());
app.use(cors({
  origin: config.frontend.url,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  credentials: true
}));
app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(requestLogMiddleware);

function sendHealth(_req: express.Request, res: express.Response) {
  res.status(200).json({
    status: 'ok',
    minio: featureFlags.isMinioAvailable,
  });
}

async function sendReady(_req: express.Request, res: express.Response) {
  try {
    await sequelize.authenticate();
    if (config.minio.enableMinIO) {
      await minioClient.listBuckets();
      if (!featureFlags.isMinioAvailable) {
        res.status(503).json({ status: 'not_ready', database: true, minio: false });
        return;
      }
    }
    res.status(200).json({
      status: 'ready',
      database: true,
      minio: featureFlags.isMinioAvailable,
    });
  } catch (error) {
    logger.error('Readiness check failed', error);
    res.status(503).json({ status: 'not_ready', database: false, minio: featureFlags.isMinioAvailable });
  }
}

const publicProbePaths = new Set([
  '/health',
  '/api/v1/health',
  '/ready',
  '/api/v1/ready',
]);

app.get('/health', sendHealth);
app.get('/api/v1/health', sendHealth);
app.get('/ready', sendReady);
app.get('/api/v1/ready', sendReady);

app.use((req, res, next) => {
  const path = req.originalUrl.split('?')[0];
  if (publicProbePaths.has(path)) {
    return next();
  }

  if (isOptionalJwtGet(req.method, path)) {
    return auth0Check(req as any, res as any, ((_err?: unknown) => next()) as any);
  }

  return auth0Check(req as any, res as any, next as any);
});

app.use('/api/v1', router);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDBWithRetry();
    logger.info('Database connection established.');

    if (config.minio.enableMinIO) {
      logger.info('MinIO integration enabled - attempting connection...');
      await connectMinioWithRetry()
        .then(() => {
          featureFlags.isMinioAvailable = true;
        })
        .catch(error => {
          logger.error('MinIO connection failed', error);
          logger.error('MinIO integration is enabled but connection failed - server will start without MinIO functionality');
          featureFlags.isMinioAvailable = false;
        });
    } else {
      logger.info('MinIO integration disabled - skipping connection');
      featureFlags.isMinioAvailable = false;
    }

    app.listen(config.server.port, () => {
      logger.info(`Snippy API v${version} started on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    logger.error('Database connection required - server will not start');
    process.exit(1);
  }
};

startServer();
