import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { Users } from '../models/user.model'; // Adjust the import path as necessary
import { Invites } from '../models/invite.model';
import { Snippets } from '../models/snippet.model';
import { Snippet_Files } from '../models/snippet_file.model';
import { Favorites } from '../models/favorite.model';
import { Comments } from '../models/comment.model';
import { defaultPolicy } from '../utils/resiliance';
import logger from '../utils/logger';

dotenv.config();

// Initialize Sequelize with MySQL configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'database',
  username: process.env.DB_USER || 'username',
  password: process.env.DB_PASS || 'password',
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 3306, // MySQL default port
  dialect: 'mysql', // Change to MySQL
  logging: false,
  models: [Users, Invites, Snippets, Snippet_Files, Favorites, Comments], // Register models for syncing
});

// Function to connect to the database with retry logic
async function connectWithRetry() {
  try{
    await defaultPolicy.execute(async () => {
    logger.info('⏳ Trying DB connection...');
    await sequelize.authenticate();
    logger.info('✅ Database connected.');
    await sequelize.sync({ alter: true }); // Sync models with the database
    logger.info('✅ Models synced.');
    });
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

export default connectWithRetry;
