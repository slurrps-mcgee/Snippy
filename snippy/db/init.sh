#!/bin/bash
set -e

# Set defaults if not provided
DB_NAME="${DB_NAME:-snippy}"
DB_USER="${DB_USER:-snippy_api}"

echo "Using database name: $DB_NAME"
echo "Using database user: $DB_USER"

echo "Creating database and user from environment variables..."

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;

-- Create user if not exists
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';

-- Grant only limited privileges (no DROP)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';

FLUSH PRIVILEGES;
EOSQL

echo "Database and limited-permission user created."
