import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import logger from '../common/utilities/logger';

const META_TABLE = 'SequelizeMeta';

/**
 * Run pending Sequelize CLI-style migrations from src/database/migrations.
 * Compatible with SequelizeMeta used by sequelize-cli.
 */
export async function runMigrations(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`${META_TABLE}\` (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [executedRows] = await sequelize.query(`SELECT name FROM \`${META_TABLE}\` ORDER BY name ASC`) as [Array<{ name: string }>, unknown];
  const executed = new Set(executedRows.map((row) => row.name));

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js'))
    .sort();

  for (const file of files) {
    if (executed.has(file)) {
      continue;
    }

    const migrationPath = path.join(migrationsDir, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(migrationPath);

    logger.info(`⏳ Running migration: ${file}`);
    await migration.up(queryInterface, sequelize.constructor);
    await sequelize.query(`INSERT INTO \`${META_TABLE}\` (name) VALUES (?)`, {
      replacements: [file],
    });
    logger.info(`✅ Migration applied: ${file}`);
  }

  if (files.every((file) => executed.has(file))) {
    logger.info('✅ Database migrations up to date.');
  }
}
