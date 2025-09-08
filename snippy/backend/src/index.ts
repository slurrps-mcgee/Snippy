import express from 'express';
import cors from "cors";
import { setupSwaggerDocs } from './utils/swaggerDocs';
import router from './routes/routes';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import sequelize from './config/sequelize';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

//Security middleware
app.use(helmet());

//CORS setup — allow only your frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

const startServer = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate()
      .then(() => console.log('Database connection established.'))
      .catch((err) => console.error('Unable to connect to the database:', err));

    // Sync all models with the database (create tables if they don't exist)
    // await sequelize.sync({ force: true }) // Use `alter: true` to update the database schema without losing data
    //   .then(() => console.log('All models were synchronized successfully.'))
    //   .catch((err) => console.error('Sequelize sync error:', err));

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
  }
};

startServer();