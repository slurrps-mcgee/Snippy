require('dotenv').config();

const shared = {
  username: process.env.DB_USER || 'snippy_api',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'snippy',
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  ...(process.env.DB_SSL === 'true'
    ? { dialectOptions: { ssl: { rejectUnauthorized: true } } }
    : {}),
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
