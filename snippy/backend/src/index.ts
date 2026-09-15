import express from 'express';
import cors from 'cors';
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

// Configure proxy trust based on TRUSTED_PROXIES environment variable.
// When empty (default), no proxies are trusted and req.ip reflects the direct socket,
// preventing X-Forwarded-For spoofing. When set, only the specified IPs/CIDRs are trusted.
if (config.proxy.trustedProxies) {
  const proxies = config.proxy.trustedProxies
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (proxies.length > 0) {
    app.set('trust proxy', proxies);
    logger.info(`Trusting proxies: ${proxies.join(', ')}`);
  } else {
    app.set('trust proxy', false);
    logger.info('No proxies trusted (TRUSTED_PROXIES is empty)');
  }
} else {
  app.set('trust proxy', false);
  logger.info('No proxies trusted (TRUSTED_PROXIES not set)');
}

setupSwaggerDocs(app);

app.use(requestIdMiddleware);
app.use(cookie());
app.use(
  helmet({
    // SPA CSP is set by nginx. Helmet's default policy would also send
    // upgrade-insecure-requests on JSON and conflict with the embed HTML route.
    contentSecurityPolicy: false,
    // CORS is the access gate; same-origin CORP would block a split SPA/API host.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: config.frontend.url,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  })
);
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
  } catch (error) {
    logger.error('Readiness check failed', error);
    res
      .status(503)
      .json({ status: 'not_ready', database: false, minio: featureFlags.isMinioAvailable });
    return;
  }

  if (config.minio.enableMinIO) {
    if (!featureFlags.isMinioAvailable) {
      res.status(503).json({ status: 'not_ready', database: true, minio: false });
      return;
    }
    try {
      await minioClient.listBuckets();
    } catch (error) {
      logger.error('Readiness check failed', error);
      res.status(503).json({ status: 'not_ready', database: true, minio: false });
      return;
    }
  }

  res.status(200).json({
    status: 'ready',
    database: true,
    minio: featureFlags.isMinioAvailable,
  });
}

const publicProbePaths = new Set(['/health', '/api/v1/health', '/ready', '/api/v1/ready']);

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
  } catch (error) {
    logger.error('Failed to start server', error);
    logger.error('Database connection required - server will not start');
    process.exit(1);
  }

  app.listen(config.server.port, () => {
    logger.info(`Snippy API v${version} started on port ${config.server.port}`);
  });

  if (!config.minio.enableMinIO) {
    logger.info('MinIO integration disabled - skipping connection');
    featureFlags.isMinioAvailable = false;
    return;
  }

  logger.info('MinIO integration enabled - attempting connection...');
  try {
    await connectMinioWithRetry();
    featureFlags.isMinioAvailable = true;
  } catch (error) {
    logger.error('MinIO connection failed', error);
    logger.error(
      'MinIO integration is enabled but connection failed - server will start without MinIO functionality'
    );
    featureFlags.isMinioAvailable = false;
  }
};

startServer();
