import { Sequelize } from 'sequelize-typescript';
import { Users } from '../entities/user.entity';
import { Snippets } from '../entities/snippet.entity';
import { SnippetFiles } from '../entities/snippetFile.entity';
import { Favorites } from '../entities/favorite.entity';
import { Comments } from '../entities/comment.entity';
import { dbConnectionPolicy } from '../common/utilities/resilience';
import logger from '../common/utilities/logger';
import { config } from '../config';
import { Assets } from '../entities/asset.entity';
import { SnippetViews } from '../entities/snippetView.entity';
import { Follows } from '../entities/follow.entity';
import { Collections } from '../entities/collection.entity';
import { CollectionSnippets } from '../entities/collectionSnippet.entity';
import { runMigrations } from './migrate';

// Initialize Sequelize with MySQL configuration
export const sequelize = new Sequelize({
  database: config.database.name,
  username: config.database.username,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: config.database.dialect,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30_000,
    idle: 10_000,
  },
});

// Add models to sequelize after initialization
sequelize.addModels([
  Users,
  Snippets,
  SnippetFiles,
  Favorites,
  Comments,
  Assets,
  SnippetViews,
  Follows,
  Collections,
  CollectionSnippets,
]);

// Function to connect to the database with retry logic
export async function connectDBWithRetry() {
  try {
    await dbConnectionPolicy.execute(async () => {
      logger.info('⏳ Trying DB connection...');
      await sequelize.authenticate();
      logger.info('✅ Database connected.');

      try {
        await runMigrations(sequelize);
        logger.info('✅ Database migrations complete.');
      } catch (migrateErr) {
        const errAny = migrateErr as any;
        const parent = errAny?.parent ?? errAny?.original ?? {};
        const details = {
          message: errAny?.message,
          stack: errAny?.stack,
          sql: errAny?.sql ?? parent?.sql,
          parent: {
            message: parent?.message,
            code: parent?.code,
            errno: parent?.errno,
            sqlMessage: parent?.sqlMessage,
            sqlState: parent?.sqlState,
            sql: parent?.sql,
          },
        };
        logger.error(`❌ Database migration failed: ${JSON.stringify(details, null, 2)}`);
        throw migrateErr;
      }
    });
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}
