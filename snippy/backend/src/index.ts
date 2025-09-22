import express, { application } from 'express';
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
import jwtCheck from './middleware/jwt.service';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

// Swagger setup
setupSwaggerDocs(app);

//Security middleware
app.use(helmet());

//CORS setup — allow only your frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'frontedn',
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

app.use(jwtCheck);

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