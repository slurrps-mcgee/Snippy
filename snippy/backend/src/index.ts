import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './common/utilities/swaggerDocs';
import router from './routes/routes';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import connectWithRetry from './database/sequelize';
import { errorHandler } from './common/utilities/error-handler';
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

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
});

app.use(limiter);

app.use(express.json());

// JWT Middleware to protect routes
// Apply jwtCheck to most routes but allow a small whitelist (public endpoints)
const jwtWhitelist: Array<{ method: string; path: string }> = [
  // add other public endpoints here if needed
];

// Middleware to check JWT, skipping whitelisted routes
app.use((req, res, next) => {
  const isWhitelisted = jwtWhitelist.some(w => w.method === req.method && w.path === req.path);
  if (isWhitelisted) return next();
  return auth0Check(req as any, res as any, next as any);
});

// Routes
app.use('/api/v1', router);

// Error handling middleware should be the last middleware
app.use(errorHandler);

// Start the server after ensuring DB connection
const startServer = async () => {
  try {
    // Connect to the database
    await connectWithRetry()
      .then(() => logger.info('Database connection established.'))
      .catch((err) => logger.error('Unable to connect to the database:', err));

    app.listen(config.server.port, () => {
      logger.info(`🚀 Snippy API v${version} starting on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start server:', error);
  }
};

// Invoke the function to start the server
startServer();