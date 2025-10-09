import { Sequelize } from 'sequelize-typescript';
import { Users } from '../models/user.model'; // Adjust the import path as necessary
import { Invite } from '../models/invite.model';
import { Snippets } from '../models/snippet.model';
import { Snippet_Files } from '../models/snippet_file.model';
import { Favorites } from '../models/favorite.model';
import { Comments } from '../models/comment.model';
import { defaultPolicy } from '../utils/resiliance';
import logger from '../utils/logger';

// Initialize Sequelize with MySQL configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'snippy',
  username: process.env.DB_USER || 'snippy_api',
  password: process.env.DB_PASS,
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  models: [Users, Invite, Snippets, Snippet_Files, Favorites, Comments], // Register models for syncing
});

// Function to connect to the database with retry logic
async function connectWithRetry() {
  try {
    await defaultPolicy.execute(async () => {
      logger.info('⏳ Trying DB connection...');
      await sequelize.authenticate(); // Test the connection
      logger.info('✅ Database connected.');
      await sequelize.sync({ force: false }); // Sync models with the database only if tables do not exist
      logger.info('✅ Models synced.');
    });
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

export default connectWithRetry;
