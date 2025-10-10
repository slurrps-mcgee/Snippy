# Snippy

This is a Codepen.io clone that can be hosted locally by anyone and is opensource.

## Overview

This repository contains a 3-service application:
- `db` – MySQL database used by the API initial scripts located in `snippy/db`
- `api` – Node/TypeScript backend located in `snippy/backend`
- `frontend` – Angular frontend located in `snippy/frontend`

Docker Compose is used to run all services together and wire environment variables from a root `.env` file.

## Prerequisites

- Docker (version supporting Compose v2+)
- Docker Compose (or Docker CLI with compose support)
- A terminal and basic familiarity with Docker commands

Verify Docker is running:

```bash
docker --version
docker compose version
```

## .env file

Put a `.env` file in the repository root (next to `docker-compose.yml`). Compose will load environment variables from that file. Example `.env`:

```ini
# DB
# OPTIONAL
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
# REQUIRED
DB_PASS=
MYSQL_ROOT_PASSWORD=

# API
# OPTIONAL
API_PORT=
FRONTEND_ORIGIN=
# If setting up invite only mode you will need to setup SMTP settings as well
INVITE_ONLY=

# REQUIRED
JWT_SECRET=
JWT_REFRESH_SECRET=
# Used for password resets this can be left blank but password resets will not function
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=

# FRONTEND
# OPTIONAL
FRONTEND_PORT=
# REQUIRED
```

Notes: Not all of these variables are needed as most have defaults

## Development

### Run downloaded application locally

Notes: You will need to create a .env file in the root of the folder next to the docker-compost.yml file

### Docker Compose File Example

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    container_name: snippy-db
    env_file:
      - ./.env
    volumes:
      - mysql-data:/var/lib/mysql
      - ./snippy/db/init.sh:/docker-entrypoint-initdb.d/init.sh
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    container_name: snippy-api
    build: ./snippy/backend
    working_dir: /backend
    volumes:
      - ./snippy/backend:/backend
    ports:
      - "${API_PORT:-3000}:3000"
    env_file:
      - ./.env
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    command: npm run dev

  frontend:
    container_name: snippy-frontend
    build: ./snippy/frontend
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    env_file:
      - ./.env
    restart: unless-stopped
    depends_on:
      - api

volumes:
  mysql-data:
```

## SETUP

### Run the full stack using docker compose pulling from dockerhub

Notes: this assumes you are using portainer to setup .env variables. If not you can update to just use a .env file from the options in the [ENV](#env-file) section

### Docker Compose File Example

```yaml
version: '3.8'
services:
  db:
    image: kennyl777/snippy-db:latest
    container_name: snippy-db
    env_file:
      - stack.env
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped

  api:
    image: kennyl777/snippy-api:latest
    container_name: snippy-api
    env_file:
      - stack.env
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    image: kennyl777/snippy-frontend:latest
    container_name: snippy-frontend
    ports:
      - "${FRONTEND_PORT:-4200}:80"
    depends_on:
      - api
    restart: unless-stopped
volumes:
  mysql-data:
```
