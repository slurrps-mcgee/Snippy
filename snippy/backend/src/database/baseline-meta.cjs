#!/usr/bin/env node
/**
 * Mark the baseline migration as applied without creating tables.
 * Use when upgrading an existing DB that was created via sequelize.sync.
 *
 * Usage (from snippy/backend, with DB_* env set):
 *   npm run db:migrate:baseline
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MIGRATION_NAME = '20260729180000-001-create-schema.js';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'snippy_api',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'snippy',
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS SequelizeMeta (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const migrationPath = path.join(__dirname, 'migrations', MIGRATION_NAME);
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${MIGRATION_NAME}`);
  }

  const [rows] = await connection.query('SELECT name FROM SequelizeMeta WHERE name = ?', [MIGRATION_NAME]);
  if (rows.length > 0) {
    console.log(`Baseline already recorded: ${MIGRATION_NAME}`);
  } else {
    await connection.query('INSERT INTO SequelizeMeta (name) VALUES (?)', [MIGRATION_NAME]);
    console.log(`Recorded baseline migration: ${MIGRATION_NAME}`);
    console.log('Existing tables were left unchanged. Restart the API to continue.');
  }

  await connection.end();
}

main().catch((err) => {
  console.error('db:migrate:baseline failed:', err.message || err);
  process.exit(1);
});
