import { Sequelize } from 'sequelize-typescript';
import { Users } from '../entities/user.entity';
import { Snippets } from '../entities/snippet.entity';
import { SnippetFiles } from '../entities/snippetFile.entity';
import { Favorites } from '../entities/favorite.entity';
import { Comments } from '../entities/comment.entity';
import { dbConnectionPolicy } from '../common/utilities/resiliance';
import logger from '../common/utilities/logger';
import { config } from '../config';

// Initialize Sequelize with MySQL configuration
export const sequelize = new Sequelize({
  database: config.database.name,
  username: config.database.username,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: config.database.dialect,
  logging: false,
});

// Add models to sequelize after initialization
sequelize.addModels([Users, Snippets, SnippetFiles, Favorites, Comments]);

// Function to connect to the database with retry logic
async function connectWithRetry() {
  try {
    await dbConnectionPolicy.execute(async () => {
      logger.info('⏳ Trying DB connection...');
      await sequelize.authenticate(); // Test the connection
      logger.info('✅ Database connected.');

      try {
        await sequelize.sync({
          force: false,
          logging: (sql) => logger.debug(`[Sequelize SQL] ${sql}`),
        }); // Sync models with the database only if tables do not exist
        logger.info('✅ Models synced.');
      } catch (syncErr) {
        const errAny = syncErr as any;

        // Extract common driver-level fields (mysql/mysql2 expose errno, code, sqlMessage, and sql)
        const parent = errAny?.parent ?? errAny?.original ?? {};
        const parentInfo = {
          message: parent?.message,
          code: parent?.code,
          errno: parent?.errno,
          sqlMessage: parent?.sqlMessage,
          sqlState: parent?.sqlState,
          sql: parent?.sql,
        };

        const details = {
          message: errAny?.message,
          stack: errAny?.stack,
          sql: errAny?.sql ?? parentInfo.sql,
          parent: parentInfo,
        };

        // Log as a single message so the logger's printf formatter includes it (avoids meta being dropped)
        logger.error(`❌ sequelize.sync failed: ${JSON.stringify(details, null, 2)}`);
        throw syncErr;
      }
    });
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

export default connectWithRetry;
