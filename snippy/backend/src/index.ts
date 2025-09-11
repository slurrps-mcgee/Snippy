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

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

//Security middleware
app.use(helmet());

//CORS setup — allow only your frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
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

//Add JWT Middleware here by Auth0
//app.use(jwtCheck); // Uncomment and configure as needed

// Routes
app.use('/api/v1', router);
// Swagger setup
setupSwaggerDocs(app);

app.use(errorHandler);

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

startServer();