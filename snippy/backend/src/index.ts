import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './utils/swaggerDocs';
import router from './routes/routes';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import connectWithRetry from './config/sequelize';
import { errorHandler } from './utils/error-handler';
import { version } from '../package.json';
import logger from './utils/logger';
import { jwtCheck } from './middleware/jwt.service';
import cookie from 'cookie-parser';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.set('trust proxy', 1);

// Swagger setup
setupSwaggerDocs(app);

app.use(cookie());

//Security middleware
app.use(helmet());

//CORS setup — allow only your frontend
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
});

app.use(limiter);

app.use(express.json());

// JWT Middleware to protect routes
// Apply jwtCheck to most routes but allow a small whitelist (public endpoints)
const jwtWhitelist: Array<{ method: string; path: string }> = [
  // add other public endpoints here if needed
];

// Debug middleware: report whether an Authorization header is present (do NOT log the token)
app.use((req, res, next) => {
  const hasAuth = Boolean(req.headers && (req.headers as any).authorization);
  logger.debug(`[auth-debug] ${req.method} ${req.path} - Authorization header present: ${hasAuth}`);
  const isWhitelisted = jwtWhitelist.some(w => w.method === req.method && w.path === req.path);
  if (isWhitelisted) return next();
  return jwtCheck(req as any, res as any, next as any);
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
      .catch((err) => logger.info('Unable to connect to the database:', err));

    app.listen(PORT, () => {
      logger.info(`🚀 Snippy API v${version} starting on port ${process.env.API_PORT || 3000}`);
    });
  } catch (error) {
    logger.info('Unable to connect to the database or start server:', error);
  }
};

// Invoke the function to start the server
startServer();